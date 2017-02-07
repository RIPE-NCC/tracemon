define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.env.utils",
    "tracemon.connector.translation"
], function(config, $, utils, TranslationConnector) {
    var antiFloodTimerNewStatus, timelineEvents;

    timelineEvents = [];

    var ConnectorFacade = function (env) {
        var translationConnector, $this;

        $this = this;
        env.loadedSources = {};
        translationConnector = new TranslationConnector(env);

        this.getRealTimeResults = function(measurement, filtering){
            filtering.stream_type = "result";
            filtering.buffering = "true";
            translationConnector.getRealTimeResults(
                filtering,
                function(result){
                    measurement.addTraceroutes(result);
                    clearTimeout(antiFloodTimerNewStatus);
                    antiFloodTimerNewStatus = setTimeout(function(){
                        env.historyManager.getLastState();
                    }, config.eventGroupingAntiFlood);
                }, this);
        };

        this.getInitialDump = function(measurement, options){
            var deferredCall, deferredArray, initialDumpPromise, getProbesPromise;

            deferredCall = $.Deferred();
            deferredArray = [];

            initialDumpPromise = translationConnector
                .getInitialDump(measurement, options)
                .done(function(data){

                    for (var n=0,length=data.length; n<length; n++){
                        if (timelineEvents.indexOf(data[n])){
                            timelineEvents.push(data[n].date);
                        }
                    }

                    measurement.addTraceroutes(data);
                });

            deferredArray.push(initialDumpPromise); // Get initial dump

            $.when
                .apply($, deferredArray)
                .then(function(){
                    $this._enrichProbes(measurement, options.sources); // Enrich the probes (e.g. check if they replied) NOTE: it's ASYNC
                    utils.observer.publish("model.history:new");
                    deferredCall.resolve(measurement);
                });

            return deferredCall.promise();
        };

        this.getAutonomousSystem = function(ip){
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getAutonomousSystem(ip)
                .done(function (data) {

                    deferredCall.resolve(data);
                });

            return deferredCall.promise();
        };

        this.getHostReverseDns = function(host){
            var deferredCall;

            deferredCall = $.Deferred();


            if (host.isPrivate || !host.ip) {
                host.reverseDns = null;
                deferredCall.resolve(host.reverseDns);
            } else if (host.reverseDns){
                deferredCall.resolve(host.reverseDns);
            } else {
                translationConnector.getHostReverseDns(host.ip)
                    .done(function (data) {
                        var reverseArray, reverse;

                        try {
                            reverseArray = data.split(".");
                            reverse = [
                                reverseArray[reverseArray.length - 3],
                                reverseArray[reverseArray.length - 2],
                                reverseArray[reverseArray.length - 1]
                            ].join(".");
                        }catch(e){
                            reverse = data;
                        }
                        host.reverseDns = reverse;
                        deferredCall.resolve(reverse);
                    });
            }

            return deferredCall.promise();
        };

        this.getGeolocation = function(host){
            var deferredCall;

            deferredCall = $.Deferred();

            if (host.isPrivate || !host.ip) {
                deferredCall.resolve(host.getLocation());
            } else if (host.getLocation()){
                deferredCall.resolve(host.getLocation());
            } else {
                translationConnector.getGeolocation(host.ip)
                    .done(function (data) {
                        host.setLocation(data);
                        deferredCall.resolve(data);
                    });
            }
            return deferredCall.promise();
        };

        this.getMeasurementInfo = function(ip){
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getMeasurementInfo(ip)
                .done(function (data) {
                    $this.getProbesInfo(data)
                        .done(function () {
                        deferredCall.resolve(data);
                    });
                });

            return deferredCall.promise();
        };

        this.getHosts = function(){
            return translationConnector.getHosts();
        };

        this.getASes = function () {
            return translationConnector.getASes();
        };

        this.getProbeInfo = function(probeId){
            return translationConnector.getProbeInfo(probeId);
        };


        this._enrichProbes = function(measurement, probesList){
            var replyingProbes;


            replyingProbes = utils.arrayUnique($.map(measurement.getTraceroutes(), function(traceroute){
                return traceroute.source.probeId;
            }));

            // Check if all the probes are replying and mark them.
            for (var n=0,length=probesList.length; n<length; n++) {
                env.loadedSources[probesList[n]].empty = (replyingProbes.indexOf(probesList[n]) == -1);
            }

        };


        this.getProbesInfo = function(measurement){
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector
                .getProbesInfo(measurement.id)
                .done(function (data) {
                    var probe;
                    for (var n=0,length=data.length; n<length; n++) {
                        probe = data[n];

                        if (env.loadedSources[probe.id]){
                            env.loadedSources[probe.id].measurements.push(probe);
                        } else {
                            env.loadedSources[probe.id] = probe;
                        }

                        measurement.sources[probe.id] = probe;
                    }
                    deferredCall.resolve(data);
                });

            return deferredCall.promise();
        };

    };

    return ConnectorFacade;

});

