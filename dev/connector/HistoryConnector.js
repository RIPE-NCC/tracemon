/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "env.config"
], function(config) {

    var HistoryConnector = function (env) {
        var $this;

        $this = this;

        this.getHistoricalProbesData = function (measurementId, probes, startDate, endDate, callback, context) {

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiResults.replace("0000", measurementId),
                data: {
                    resolution: $this._getDataResolution(startDate, endDate),
                    start: Math.ceil(startDate.getTime()/1000),
                    stop: Math.floor(endDate.getTime()/1000),
                    prb_id: $.map(probes, function(probe){return probe.id}).join(",")
                },
                success: function(data){
                    callback.call(context, data);
                }
            });

        };



        this.getMeasurementInfo = function (measurementId, callback, context) {

            $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiInfo.replace("0000", measurementId),
                success: function (data) {
                    callback.call(context, data);
                },
                error: function () {
                    throw "It is not possible to retrieve measurement information for this ID";
                }
            });
        };




        this._getDataResolution = function (startDate, endDate) {
            return env.resolution;
        };

    };

    return HistoryConnector;

});

