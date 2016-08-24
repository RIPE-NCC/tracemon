define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.env.utils",
    "tracemon.connector.translation"
], function(config, $, utils, TranslationConnector) {
    var antiFloodTimerNewStatus, timelineEvents;

    timelineEvents = [];

    var ConnectorFacade = function (env) {
        var translationConnector;

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
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getInitialDump(measurement, options)
                .done(function(data){

                    for (var n=0,length=data.length; n<length; n++){
                        if (timelineEvents.indexOf(data[n])){
                            timelineEvents.push(data[n].date);
                        }
                    }

                    measurement.addTraceroutes(data);
                    deferredCall.resolve(measurement);
                });

            return deferredCall.promise();
        };


        this.getNextEvent = function(){

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

            translationConnector.getHostReverseDns(host.ip)
                .done(function (data) {
                    deferredCall.resolve(data);
                });

            return deferredCall.promise();
        };


        this.getGeolocation = function(host){
            var deferredCall;

            deferredCall = $.Deferred();

            if (host.isPrivate || !host.ip) {
                deferredCall.resolve(null);
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
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getMeasurementInfo(ip)
                .done(function (data) {
                    deferredCall.resolve(data);
                });

            return deferredCall.promise();
        };

        this.getHosts = function(){
            return translationConnector.getHosts();
        };


    };

    return ConnectorFacade;

});

