/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment"
], function(config, utils, $, moment) {

    var HistoryConnector = function (env) {
        var hostsResolutionByIp, geolocByIp, neighboursByAsn, probesInfo, measurementInfo;

        hostsResolutionByIp = {};
        geolocByIp = {};
        neighboursByAsn = {};
        probesInfo = {};
        measurementInfo = {};

        this.getMeasurementResults = function (measurementId, options) {
            var queryParams;

            if (!options.startDate || !options.stopDate){
                throw "To retrieve data, a time range is required";
            }

            queryParams = {
                start: options.startDate.unix(),
                stop: options.stopDate.unix()
                // include: "geo"
            };

            if (options.sources) {
                queryParams.probes = options.sources.join(',');
            }

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                timeout: config.ajaxTimeout,
                url: env.dataApiResults.replace("0000", measurementId),
                data: queryParams
            });
        };

        this.getMeasurementInfo = function (measurementId){

            if (!measurementInfo[measurementId]){
                measurementInfo[measurementId] =  $.ajax({
                    type: 'GET',
                    dataType: "jsonp",
                    cache: false,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiMetadata.replace("0000", measurementId)
                });
            }

            return measurementInfo[measurementId];
        };


        this.getHostReverseDns = function (ip) {

            if (!hostsResolutionByIp[ip]) {
                hostsResolutionByIp[ip] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiReverseDns,
                    data: {
                        resource: ip
                    }
                });
            }

            return hostsResolutionByIp[ip];
        };


        this.getGeolocation = function (ip) {

            if (!geolocByIp[ip]) {
                geolocByIp[ip] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiGeolocation,
                    data: {
                        resource: ip
                    }
                });
            }

            return geolocByIp[ip];
        };


        this.getNeighbours = function (asn) {

            if (!neighboursByAsn[asn]) {
                neighboursByAsn[asn] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiAsnNeighbours,
                    data: {
                        resource: asn
                    }
                });
            }

            return neighboursByAsn[asn];
        };

        this.getProbesInfo = function(measurementId){

            if (measurementInfo[measurementId]){
                return measurementInfo[measurementId]; // It's the same API, it may change in the future
            }

            if (!probesInfo[measurementId]){
                probesInfo[measurementId] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiMetadata.replace("0000", measurementId),
                    data: {
                        type: "jsonp"
                    },
                    error: function () {
                        env.main.error("It is not possible to retrieve measurement information for this ID", "connection-fail");
                    }
                });

            }

            return probesInfo[measurementId];
        };


    };

    return HistoryConnector;

});

