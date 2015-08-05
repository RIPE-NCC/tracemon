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
        var $this, slowAnswerTimer;

        $this = this;

        this.getHistoricalProbesData = function (measurementId, probes, startTimestamp, stopTimestamp, callback, context) {

            if (slowAnswerTimer) {
                clearTimeout(slowAnswerTimer);
            }

            slowAnswerTimer = setTimeout(function(){
                env.main.error("Server is responding slowly", "info");
            }, config.slowServerIntervalMilliseconds);


            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiResults.replace("0000", measurementId),
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
                    clearTimeout(slowAnswerTimer);
                    callback.call(context, data);
                },
                error: function(){
                    clearTimeout(slowAnswerTimer);
                    env.main.error("It is not possible to download data from the API", "connection-fail");
                }
            });

        };



        this.getMeasurementInfo = function (measurementId, callback, context) {

            if (slowAnswerTimer) {
                clearTimeout(slowAnswerTimer);
            }

            slowAnswerTimer = setTimeout(function(){
                env.main.error("Server is responding slowly", "info");
            }, config.slowServerIntervalMilliseconds);


            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiMeta.replace("0000", measurementId),
                data: {
                    type:"jsonp"
                },
                //url: 'https://local.ripe.net:8000/api/internal/routequake/' + measurementId + '/',
                success: function (data) {
                    clearTimeout(slowAnswerTimer);
                    callback.call(context, data);
                },
                error: function () {
                    clearTimeout(slowAnswerTimer);
                    env.main.error("It is not possible to retrieve measurement information for this ID", "connection-fail");
                }
            });
        };



    };

    return HistoryConnectorAutoResolution;

});

