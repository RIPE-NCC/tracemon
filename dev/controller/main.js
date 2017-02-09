define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment",
    "tracemon.model.autonomousSystem",
    "tracemon.model.hop",
    "tracemon.model.host",
    "tracemon.model.measurement",
    "tracemon.model.traceroute",
    "tracemon.connector.facade",
    "tracemon.view.main",
    "tracemon.controller.history-manager",
    "tracemon.view.templateManager",
    "tracemon.controller.source-selection"
], function(config, utils, $, moment, AutonomousSystem, Hop, Host, Measurement, Traceroute, Connector, MainView,
            HistoryManager, TemplateManagerView, SourceSelectionHelper) {

    var main = function (env) {
        var $this, sourceSelection, initialModelCreated;

        $this = this;
        initialModelCreated = false;
        sourceSelection = new SourceSelectionHelper(env);

        this.exposedMethods = ["on", "getMeasurements", "getCurrentState", "addMeasurement", "updateCurrentData",
            "addMeasurements", "applyConfiguration", "getShownSources", "setShownSources", "addShownSource",
            "getSources", "setTimeRange", "removeMeasurement", "init"];

        this._updateFinalQueryParams = function () {
            var initialParams, finalParams, startDate, stopDate, sourcesAmount, instant;

            if (Object.keys(env.loadedMeasurements).length > 0) {

                initialParams = env.queryParams;
                instant = initialParams.instant;

                stopDate = (initialParams.stopTimestamp) ?
                    moment.unix(initialParams.stopTimestamp).utc() :
                    env.metaData.stopDate;

                startDate = (initialParams.startTimestamp) ?
                    moment.unix(initialParams.startTimestamp).utc() :
                    moment(stopDate).substract(config.defaultLoadedResultSetWindow, "seconds");

                if (!instant || !(startDate.isAfeter(instant) && instant.isBefore(stopDate))) {
                    instant = (config.startWithLastStatus) ? stopDate: startDate;
                }
                sourcesAmount = initialParams.defaultNumberOfDisplayedSources || config.defaultNumberOfDisplayedSources;

                finalParams = {
                    startDate: startDate,
                    stopDate: stopDate,
                    sources: initialParams.sources || sourceSelection.getInitialSourcesSelection(sourcesAmount),
                    measurements: initialParams.measurements,
                    instant: instant
                };

                env.finalQueryParams = finalParams;
                this._updateSelectedSources();
            } else {
                throw "To compute the final query params, at least one measurement must be loaded"
            }
        };

        this._newResultsetLoaded = function(measurements){
            var measurement;

            if (!initialModelCreated){
                initialModelCreated = true;
                utils.observer.publish("model.ready");
            }

            for (var n=0,length=measurements.length; n<length; n++) {
                measurement = measurements[n];
                if (env.realTimeUpdate) {
                    env.connector.getRealTimeResults(measurement);
                }
            }
        };

        this._updateSelectedSources = function(){

            for (var probeId in env.loadedSources){ // Update source selection boolean
                env.loadedSources[probeId].select = (env.finalQueryParams.sources.indexOf(parseInt(probeId)) > -1);
            }
        };

        this._updateMetaData = function(){
            var measurement;

            for (var msmId in env.loadedMeasurements){
                measurement = env.loadedMeasurements[msmId];

                env.metaData = {
                    startDate: (env.metaData.startDate) ?
                        moment.min(measurement.startDate, env.metaData.startDate) :
                        measurement.startDate,
                    stopDate: (measurement.stopDate && env.metaData.stopDate) ?
                        moment.max(measurement.stopDate, env.metaData.stopDate) : null // Null if no measurements have a stopDate
                };
            }

        };

        this._startProcedure = function(){
            try {
                this._applyUrl();
                console.log("PermaLink applied");
            } catch(notValidUrl) {
                console.log(notValidUrl);
                if (env.queryParams) {
                    this.applyConfiguration(env.queryParams);
                    console.log("Embed code configuration applied");
                }
            }
        };

        this._applyUrl = function(){
            this.applyConfiguration(env.urlManager.getConfigurationFromUrl());
        };

        this.addMeasurements = function (msmsIDlist, callback) {
            var newMeasurementsToLoad, msmId;

            newMeasurementsToLoad = [];
            for (var n=0,length= msmsIDlist.length; n<length; n++) { // Find the new measurements
                msmId = msmsIDlist[n];

                if (!env.loadedMeasurements[msmId]){
                    newMeasurementsToLoad.push(msmId)
                }
            }

            env.connector
                .getMeasurements(newMeasurementsToLoad)
                .done(function (measurements) {
                    var measurement, source;

                    for (var n=0,length=measurements.length; n<length; n++){
                        measurement = measurements[n];
                        env.loadedMeasurements[measurement.id] = measurement;

                        for (var sourceKey in measurement.sources) {
                            source = measurement.sources[sourceKey];
                            env.loadedSources[source.id] = source;
                        }
                        utils.observer.publish("model.measurement:new", measurement);
                    }

                    $this._updateMetaData();
                    if (callback){
                        callback(msmsIDlist);
                    }
                });
        };

        this.updateData = function(callback) { // It must use the final params
            var params, measurements;

            params = env.finalQueryParams;

            measurements = $.map(params.measurements, function(msmId){
                return env.loadedMeasurements[msmId];
            });

            try {
                env.connector
                    .getMeasurementsResults(measurements, {
                            startDate: params.startDate,
                            stopDate: params.stopDate,
                            sources: params.sources
                        }
                    ).done(function(measurements){
                    $this._newResultsetLoaded(measurements);
                    if (callback){
                        callback(measurements);
                    }
                });

            } catch (error){
                var errorObj = (error.type) ? error : { type: "uncaught", message: error };
                utils.observer.publish("error", errorObj);
                console.log(errorObj);
            }

        };

        this.getMeasurements = function(){
            return env.loadedMeasurements;
        };

        this.error = function(message, type){

            env.template.dom.message
                .html(message)
                .show()
                .delay(config.messageOverlayDurationSeconds * 1000)
                .fadeOut();

            switch(type){

                case "connection-fail":
                    console.log(message);
                    break;

                case "error":
                    throw message;
                    break;

                case "info":
                    console.log(message);
                    break;
            }
        };

        this.setShownSources = function (sources) {
            this.shownSources = sources;
            this.updateData();
            utils.observer.publish("view:probe-set", this.shownSources);
        };

        this.getShownSources = function () {
            return this.shownSources;
        };

        this.getSources = function(){
            return env.loadedSources;
        };

        this.addShownSource = function (source) {
            var currentSources = this.shownSources;
            if (currentSources.indexOf(source) == -1){
                currentSources.push(source);
                this.setShownSources(currentSources);
            } else {
                throw "Source already selected";
            }
        };

        this.addMeasurement = function(msmId){
            if (env.loadedMeasurements[msmId]){
                throw "Measurement already loaded";
            }
            this.addMeasurements([msmId]);
        };

        this.removeMeasurement = function(msmId){
            if (!env.loadedMeasurements[msmId]){
                throw "The measurement is not loaded";
            }
            delete env.loadedMeasurements[msmId];
            utils.observer.publish("model.measurement:remove", msmId);
        };

        this.applyConfiguration = function(conf){
            env.queryParams = conf;

            this.addMeasurements(env.queryParams.measurements, function(){
                $this._updateFinalQueryParams();
                $this.updateData(function(){
                    env.historyManager.getStateAt(env.finalQueryParams.instant);
                });
            });
        };

        this.getCurrentState = function () {
            if (initialModelCreated && Object.keys(env.loadedMeasurements).length > 0){
                return env.historyManager.getCurrentState();
            } else {
                throw "You have to init the widget and load a measurement before to be able to get the model"
            }
        };

        this.setTimeRange = function(start, stop){ // Accept timestamps for public API
            env.finalQueryParams.startDate = moment.unix(start).utc();
            env.finalQueryParams.stopDate = moment.unix(stop).utc();
            env.main.updateData();
            utils.observer.publish("view.time-selection:change", { startDate: env.startDate, stopDate: env.stopDate });
        };

        this.on = function(event, callback){
            utils.observer.subscribe(event, callback, this);
        };

        this.init = function(){
            env.connector = new Connector(env);
            env.historyManager = new HistoryManager(env);

            if (!env.onlyCore) {
                env.template = new TemplateManagerView(env);
                env.mainView = new MainView(env);
            }

            this._startProcedure();

            if (!env.onlyCore) {
                env.template.init();
            }
        };

    };

    return main;
});