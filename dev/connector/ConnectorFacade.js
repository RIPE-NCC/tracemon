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
        this.loadedProbes = {};
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

            // getProbesPromise = this.getProbesInfo(measurement);

            deferredArray.push(initialDumpPromise); // Get initial dump
            // deferredArray.push(getProbesPromise); // Get info about the probes involved

            $.when
                .apply($, deferredArray)
                .then(function(){
                    $this._enrichProbes(measurement); // Enrich the probes (e.g. check if they replied) NOTE: it's ASYNC
                    deferredCall.resolve(measurement);
                    utils.observer.publish("model.history:new");
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
                host.location = null;
                deferredCall.resolve(host.location);
            } else if (host.location){
                deferredCall.resolve(host.location);
            } else {
                translationConnector.getGeolocation(host.ip)
                    .done(function (data) {
                        host.location = data;
                        deferredCall.resolve(data);
                    });
            }
            return deferredCall.promise();
        };

        this.getMeasurementInfo = function(ip){
            var deferredCall, getProbesPromise, deferredArray, measurementInfoPromise;

            deferredArray = [];
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


        this._enrichProbes = function(measurement){
            var replyingProbes, probesList;

            probesList = this.loadedProbes;

            replyingProbes = utils.arrayUnique($.map(measurement.getTraceroutes(), function(traceroute){
                return traceroute.source.probeId;
            }));

            // Check if all the probes are replying and mark them.
            for (var probeKey in probesList){
                probesList[probeKey].empty = (replyingProbes.indexOf(probesList[probeKey].id) == -1);
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

                        if ($this.loadedProbes[probe.id]){
                            $this.loadedProbes[probe.id].measurements.push(probe);
                        } else {
                            $this.loadedProbes[probe.id] = probe;
                        }
                    }
                    deferredCall.resolve(data);
                });

            return deferredCall.promise();
        };

    };

    return ConnectorFacade;

});

