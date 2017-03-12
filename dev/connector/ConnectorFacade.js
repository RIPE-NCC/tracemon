define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.env.utils",
    "tracemon.connector.translation"
], function(config, $, utils, TranslationConnector) {
    var antiFloodTimerNewStatus;


    var ConnectorFacade = function (env) {
        var translationConnector, $this, cache;

        $this = this;
        translationConnector = new TranslationConnector(env);
        cache = {
            geoRequests: {}
        };

        this.getRealTimeResults = function(measurement, filtering){
            filtering = filtering || {};
            filtering.stream_type = "result";
            filtering.buffering = "true";
            filtering.msm = measurement.id;
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

        this.getMeasurementsResults = function(measurements, options){
            var deferredCall, deferredArray, resultsPromise,measurement;

            deferredCall = $.Deferred();
            deferredArray = [];

            for (var n=0,length=measurements.length; n<length; n++){
                measurement = measurements[n];

                resultsPromise = translationConnector
                    .getMeasurementResults(measurement, options);

                deferredArray.push(resultsPromise); // Get results
            }


            $.when
                .apply($, deferredArray)
                .then(function(){
                    var measurements, measurement;

                    measurements = arguments;

                    for (var n=0,length=measurements.length; n<length; n++){
                        measurement = measurements[n];
                        $this._enrichProbes(measurement, options.sources); // Enrich the probes (e.g. check if they replied) NOTE: it's ASYNC
                    }
                    utils.observer.publish("model.history:new");
                    deferredCall.resolve(measurements);
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
                deferredCall.resolve(null);
            } else if (host.reverseDns){
                deferredCall.resolve(host.reverseDns);
            } else {
                translationConnector.getHostReverseDns(host)
                    .done(function (data) {
                        deferredCall.resolve(data);
                    });
            }

            return deferredCall.promise();
        };

        this.getGeolocation = function(host){
            var deferredCall;

            if (cache.geoRequests[host.ip]){
                return cache.geoRequests[host.ip];
            } else {
                deferredCall = $.Deferred();

                if (host.isPrivate || !host.ip) {
                    deferredCall.resolve(null);
                } else if (host.getLocation()) {
                    deferredCall.resolve(host.getLocation());
                } else {
                    translationConnector.getGeolocation(host)
                        .done(function (data) {
                            deferredCall.resolve(data);
                        });
                }
                cache.geoRequests[host.ip] = deferredCall.promise();
                
                return cache.geoRequests[host.ip];
            }
        };

        this.getMeasurements = function(measurementIds){
            var deferredCall, measurementId, promises, deferredArray;

            deferredCall = $.Deferred();
            deferredArray = [];


            for (var n=0,length=measurementIds.length; n<length; n++) {
                measurementId = measurementIds[n];

                promises = translationConnector
                    .getMeasurementInfo(measurementId);

                deferredArray.push(promises);
            }

            $.when
                .apply($, deferredArray)
                .then(function(){
                    deferredCall.resolve(arguments);
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
    };

    return ConnectorFacade;

});

