/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment",
    "tracemon.connector.translation"
], function(config, utils, $, moment, TranslateConnector) {

    var CacheConnector = function (env) {
        var $this, translateConnector, previousFinalParamsQuery;

        $this = this;
        translateConnector = new TranslateConnector(env);

        this.getHosts = translateConnector.getHosts.bind(translateConnector);
        this.getASes = translateConnector.getASes.bind(translateConnector);
        this.getRealTimeResults = translateConnector.getRealTimeResults.bind(translateConnector);

        this._filterBySources = function (measurement) {
            var sources = env.finalQueryParams.sources;

            if (sources.length > 0){
                var oldTraceroutes, newTraceroutes;

                oldTraceroutes = measurement.getTraceroutes();
                measurement.empty();

                newTraceroutes = oldTraceroutes.filter(function (traceroute) {
                    return sources.indexOf(traceroute.source.probeId) != -1;
                });

                measurement.addTraceroutes(newTraceroutes)
            }
        };

        this._filterByTime = function (measurement) {
            var oldTraceroutes, newTraceroutes;

            oldTraceroutes = measurement.getTraceroutes();
            measurement.empty();

            newTraceroutes = oldTraceroutes.filter(function (traceroute) {
                return traceroute.date.isSameOrAfter(env.finalQueryParams.startDate)
                    && traceroute.date.isSameOrBefore(env.finalQueryParams.stopDate);
            });

            measurement.addTraceroutes(newTraceroutes)
        };

        this._partiallyCached = function (options) {
            var currentParams;

            currentParams = env.finalQueryParams;

            if (previousFinalParamsQuery
                && currentParams.startDate.isSame(previousFinalParamsQuery.startDate)
                && currentParams.stopDate.isSame(previousFinalParamsQuery.stopDate)){ // Same time range

                if (utils.containsAll(currentParams.sources, previousFinalParamsQuery.sources)
                    && utils.containsAll(previousFinalParamsQuery.sources, currentParams.sources)){
                    return null; // Nothing to query for, they are exactly the same
                } else {

                    options.sources = utils.removeSubArray(currentParams.sources, previousFinalParamsQuery.sources);

                    return (options.sources.length > 0) ?  options : null;
                }
            }

            return options; // No cache usable, has to be fetched from scratch
        };

        this._applyFilters = function (measurement) {
            $this._filterBySources(measurement); // remove source not longer requested
            $this._filterByTime(measurement); // remove traceroutes not longer requested

            return measurement;
        };

        this.getMeasurementResults = function (measurement, options){
            var deferredCall;

            options = this._partiallyCached(options);

            console.log("OPTIONS", options);

            deferredCall = $.Deferred();

            if (options === null){
                this._applyFilters(measurement);
                deferredCall.resolve(measurement);
            } else {
                try {
                    translateConnector
                        .getMeasurementResults(measurement, options)
                        .done(function (data) {
                            $this._applyFilters(measurement);
                            deferredCall.resolve(measurement);

                        })
                        .fail(function (error) {
                            deferredCall.reject(error);
                        });
                } catch (error) {
                    deferredCall.reject(error);
                }
            }

            previousFinalParamsQuery = utils.clone(env.finalQueryParams);

            return deferredCall.promise();
        };

        this.getMeasurementInfo = translateConnector.getMeasurementInfo.bind(translateConnector);

        this.getHostReverseDns = translateConnector.getHostReverseDns.bind(translateConnector);

        this.getGeolocation = translateConnector.getGeolocation.bind(translateConnector);

        this.getNeighbours = translateConnector.getNeighbours.bind(translateConnector);

        this.getProbeInfo = translateConnector.getProbeInfo.bind(translateConnector);

        this.getProbesInfo = translateConnector.getProbesInfo.bind(translateConnector);
    };

    return CacheConnector;

});

