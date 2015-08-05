/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "env.config",
    "lib.jquery-amd"
], function(config, $) {

    var HistoryConnectorAutoResolution = function (env) {
        var $this;

        $this = this;

        this.getHistoricalProbesData = function (measurementId, probes, startTimestamp, stopTimestamp, callback, context) {

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiResults.replace("0000", measurementId),
                //url: 'https://local.ripe.net:8000/api/internal/routequake-results/' + measurementId + '/',
                data: {
                    "resolution": "auto",
                    "show-header": true,
                    "type": "jsonp",
                    "max-samples": env.maxSamplesPerRow,
                    start: startTimestamp,
                    stop: stopTimestamp,
                    compact: true,
                    prb_id: $.map(probes, function(probe){return probe.id}).join(",")
                },
                success: function(data){
                    callback.call(context, data);
                }
            });

        };



        this.getMeasurementInfo = function (measurementId, callback, context) {

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiMeta.replace("0000", measurementId),
                data: {
                    type:"jsonp"
                },
                //url: 'https://local.ripe.net:8000/api/internal/routequake/' + measurementId + '/',
                success: function (data) {
                    callback.call(context, data);
                },
                error: function () {
                    throw "It is not possible to retrieve measurement information for this ID";
                }
            });
        };



    };

    return HistoryConnectorAutoResolution;

});

