define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.env.utils",
    "tracemon.connector.translation"
], function(config, $, utils, TranslationConnector) {
    var antiFloodTimerNewStatus;


    var ConnectorFacade = function (env) {
        var translationConnector, autonomousSystems;

        translationConnector = new TranslationConnector(env);

        this.getRealTimeResults = function(measurement, filtering){
            filtering.stream_type = "result";
            translationConnector.getRealTimeResults(
                filtering,
                function(result){
                    measurement.addTraceroutes(result);
                    clearTimeout(antiFloodTimerNewStatus);
                    antiFloodTimerNewStatus = setTimeout(function(){
                        env.main.getLastState();
                    }, config.eventGroupingAntiFlood);
                }, this);
        };


        this.getInitialDump = function(measurement, options){
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getInitialDump(measurement, options)
                .done(function(data){
                    measurement.addTraceroutes(data);
                    deferredCall.resolve(measurement);
                });

            return deferredCall.promise();
        };


        this.getAutonomousSystem = function(ip){
            var deferredCall;

            deferredCall = $.Deferred();

            translationConnector.getAutonomousSystem(ip)
                .done(function (data) {

                    console.log(data);
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

            translationConnector.getGeolocation(host.ip)
                .done(function (data) {
                    deferredCall.resolve(data);
                });

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

