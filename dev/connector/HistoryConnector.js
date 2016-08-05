/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(config, utils, $) {

    var HistoryConnector = function (env) {
        var requestsByIp, hostsResolutionByIp, geolocByIp, neighboursByAsn;

        requestsByIp = {};
        hostsResolutionByIp = {};
        geolocByIp = {};
        neighboursByAsn = {};

        this.getInitialDump = function (measurementId, options) {
            var queryParams;

            if (!options.startDate){
                throw "The start date is required";
            }

            queryParams = {
                start: utils.dateToUTCTimestamp(options.startDate)
            };
            
            if (options.stopDate) {
                queryParams.stop = utils.dateToUTCTimestamp(options.stopDate);
            }
            
            if (options.sources) {
                queryParams.probe_sources = options.sources;
            }

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiResults.replace("0000", measurementId),
                data: queryParams,
                success: function (data) {
                    //clearTimeout(slowAnswerTimer);
                    //callback.call(context, data);
                },
                error: function (e) {
                    //clearTimeout(slowAnswerTimer);
                    //env.main.error("It is not possible to download data from the API", "connection-fail");
                }
            });
        };

        this.getMeasurementInfo = function (measurementId){

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiMetadata.replace("0000", measurementId),
                //data: {},
                success: function (data) {
                },
                error: function (e) {
                }
            });
        };

        // this.getAutonomousSystem = function (ip) {
        //
        //     if (!requestsByIp[ip]) {
        //         requestsByIp[ip] = $.ajax({
        //             dataType: "jsonp",
        //             cache: false,
        //             url: env.dataApiAsAnnotation,
        //             data: {
        //                 resources: ip
        //             }
        //         });
        //     }
        //     //requestsByIp[ip].done(function(){
        //     //    delete requestsByIp[ip];
        //     //});
        //
        //     return requestsByIp[ip];
        // };

        this.getHostReverseDns = function (ip) {

            if (!hostsResolutionByIp[ip]) {
                hostsResolutionByIp[ip] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
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
                    url: env.dataApiGeolocation,
                    data: {
                        resource: ip
                    }
                });
            }

            return geolocByIp[ip];
        };


        this.getHostReverseDns = function (asn) {

            if (!hostsResolutionByIp[ip]) {
                hostsResolutionByIp[ip] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    url: env.dataApiReverseDns,
                    data: {
                        resource: asn
                    }
                });
            }

            return hostsResolutionByIp[ip];
        };


        this.getNeighbours = function (asn) {

            if (!neighboursByAsn[asn]) {
                neighboursByAsn[asn] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    url: env.dataApiAsnNeighbours,
                    data: {
                        resource: asn
                    }
                });
            }

            return neighboursByAsn[asn];
        };


    };

    return HistoryConnector;

});

