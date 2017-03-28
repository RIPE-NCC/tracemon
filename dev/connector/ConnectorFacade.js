define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.env.utils",
    "tracemon.connector.translation",
    "tracemon.connector.persist-host",
    "tracemon.connector.log.persist"
], function(config, $, utils, TranslationConnector, PersistHostConnector, LogRestConnector) {
    var antiFloodTimerNewStatus;


    var ConnectorFacade = function (env) {
        var translationConnector, $this, cache, persitHostConnector, logConnector;

        $this = this;
        translationConnector = new TranslationConnector(env);
        persitHostConnector = new PersistHostConnector(env);
        logConnector = new LogRestConnector(env);
        cache = {
            geoRequests: {}
        };

        if (env.sendErrors) {
            window.onerror = function (error, url, line) {
                $this.persistLog("document", error + " url: " + url + " line: " + line);
            };

            utils.observer.subscribe("error", function (error) {
                this.persistLog(error.type, error.message);
            }, this);
            
            
        }

        this._handleError = function(error){
            var message;

            message = config.errors[error] || error;
            if (error) {
                utils.observer.publish("error", {
                    type: error,
                    message: message
                });
            }
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
                }, function(error){
                    $this._handleError(error);
                });

            return deferredCall.promise();
        };

        this.getAutonomousSystem = function(ip){
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getAutonomousSystem(ip)
                .done(function (data) {

                    deferredCall.resolve(data);
                })
                .fail(function(error){
                    $this._handleError(error);
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
                    })
                    .fail(function(error){
                        $this._handleError(error);
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
                        })
                        .fail(function(error){
                            $this._handleError(error);
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
                    deferredCall.resolve([].slice.call(arguments));
                }, function(error){
                    $this._handleError(error);
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

        this.persistLog = function(type, log){
            var browserVersion;

            if (config.persistLog) {
                browserVersion = utils.getBrowserVersion();
                logConnector.error(type, log + ' (browser: ' + browserVersion.name + ' ' + browserVersion.version.toString() + ')');
            }

        };

        this.persist = function(){
            var hosts, host, callsArray, deferredCall;


            deferredCall = $.Deferred();
            hosts = this.getHosts();
            callsArray = [];
            for (var n=0,length=hosts.length; n<length; n++) {
                host = hosts[n];

                if (!host.isPrivate && host.ip && host.dirty){
                    callsArray.push(persitHostConnector.persist(host));
                }
            }

            $.when
                .apply($, callsArray)
                .then(function(){

                    for (var n=0,length=hosts.length; n<length; n++) {
                        hosts[n].dirty = false;
                    }
                    deferredCall.resolve();
                }, function(error){
                    $this._handleError(error);
                    deferredCall.reject();
                });

            return deferredCall.promise();
        };
    };

    return ConnectorFacade;

});

