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
    "tracemon.view.templateManager"
], function(config, utils, $, moment, AutonomousSystem, Hop, Host, Measurement, Traceroute, Connector, MainView,
            HistoryManager, TemplateManagerView) {

    var main = function (env) {
        var $this, now, initCompleted;

        $this = this;
        initCompleted = false;
        this.shownSources = null;
        this.loadedMeasurements = {};

        this.exposedMethods = ["on", "getMeasurements", "getModel", "addMeasurement", "updateCurrentData", "loadMeasurements",
            "applyConfiguration", "getShownSources", "setShownSources", "addShownSource", "getSources", "setTimeRange", "init"];

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

        this.applyUrl = function(){
            this.applyConfiguration(env.urlManager.getConfigurationFromUrl());
        };

        this.applyConfiguration = function(conf){

            if (conf.startTimestamp && conf.stopTimestamp){
                env.startDate = moment.unix(conf.startTimestamp).utc();
                env.stopDate = moment.unix(conf.stopTimestamp).utc();
            }

            if (conf.measurements) {
                this.updateData(conf.measurements);
            }
        };

        this.updateCurrentData = function() {
            // env.historyManager.reset();
            this.updateData(Object.keys(this.loadedMeasurements));
        };

        this.computeInitialSources = function(){
            var out;

            out = [];
            for (var probeKey in env.connector.loadedProbes){
                out.push(parseInt(probeKey));
                if (out.length == env.queryParams.numberOfProbes){
                    break;
                }
            }

            return out;
        };

        this.setShownSources = function (sources) {
            this.shownSources = sources;
            this.updateCurrentData();
            utils.observer.publish("view:probe-set", this.shownSources);
        };

        this.getShownSources = function () {
            return this.shownSources;
        };

        this.getSources = function(){
         return env.connector.loadedProbes;
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

        this.updateData = function(measurementsIDtoLoad) {

            this.loadMeasurements(measurementsIDtoLoad, function (measurementsLoaded) { // 3749061, 4471092 (loop on *)
                var deferredArray, deferredQuery, msmId;

                $this.shownSources = $this.shownSources || $this.computeInitialSources();

                for (var probeId in env.connector.loadedProbes){ // Update source selection boolean
                    env.connector.loadedProbes[probeId].select = ($this.shownSources.indexOf(parseInt(probeId)) > -1);
                }
                // env.template.showLoadingImage(true);
                deferredArray = [];

                try {
                    for (var n=0,length= measurementsLoaded.length; n<length; n++) { // Find the new measurements
                        msmId = measurementsLoaded[n];

                        deferredQuery = env.connector
                            .getInitialDump($this.loadedMeasurements[msmId], {
                                startDate: env.startDate,
                                stopDate: env.stopDate,
                                sources: $this.shownSources
                            }).done(function (measurement) {

                                if (env.realTimeUpdate) {
                                    env.connector.getRealTimeResults(measurement, { msm: measurement.id });
                                }

                                utils.observer.publish("model.measurement:new", measurement);
                            });

                        deferredArray
                            .push(deferredQuery);
                    }
                } catch (error){
                    var errorObj = (error.type) ? error : { type: "uncaught", message: error };
                    utils.observer.publish("error", errorObj);
                    console.log(errorObj);
                }

                $.when
                    .apply($, deferredArray)
                    .then(function(){
                        env.historyManager.getFirstState();
                        if (!initCompleted){
                            initCompleted = true;
                            utils.observer.publish("model.ready", $this.getModel());
                        }
                        // env.template.showLoadingImage(false);
                    });

            });
        };

        this.getMeasurements = function(){
            return this.loadedMeasurements;
        };

        this.addMeasurement = function(msmId){
            var measurements;

            measurements = Object.keys($this.loadedMeasurements);

            if (measurements.indexOf(msmId) == -1){
                measurements.push(msmId);
            }else{
                throw "Measurement already loaded"
            }
            this.updateData(measurements);
        };

        this.loadMeasurements = function (msmsIDlist, callback) {
            var newMeasurementsToLoad, msmId;

            newMeasurementsToLoad = [];
            for (var n=0,length= msmsIDlist.length; n<length; n++) { // Find the new measurements
                msmId = msmsIDlist[n];

                if (!this.loadedMeasurements[msmId]){
                    newMeasurementsToLoad.push(msmId)
                }
            }

            $.when.apply($, $.map(newMeasurementsToLoad, function (msm){
                return env.connector
                    .getMeasurementInfo(parseInt(msm))
                    .done(function (measurement) {
                        if (!env.meta) {
                            env.meta = {
                                startDate: Infinity,
                                stopDate: -Infinity
                            };
                        }

                        env.meta.startDate = Math.min(measurement.startDate.unix(), env.meta.startDate);
                        if (measurement.stopDate) {
                            env.meta.stopDate = Math.min(Math.max(measurement.stopDate.unix(), env.meta.stopDate), moment().utc().unix());
                        } else {
                            env.meta.stopDate = moment().utc().unix();
                        }
                        $this.loadedMeasurements[measurement.id] = measurement;
                    });
            }))
                .done(function(){
                    callback(newMeasurementsToLoad);
                });
        };

        this._startProcedure = function(){
            try {
                this.applyUrl();
                console.log("PermaLink applied");
            } catch(notValidUrl) {
                console.log(notValidUrl);
                if (env.queryParams) {
                    this.applyConfiguration(env.queryParams);
                    console.log("Embed code configuration applied");
                }
            }
        };

        this.getModel = function () {
            if (initCompleted && Object.keys(this.loadedMeasurements).length > 0){
                return env.historyManager.getLastState();
            } else {
                throw "You have to init the widget and load a measurement before to be able to get the model"
            }
        };

        this.setTimeRange = function(start, stop){ // Accept timestamps for public API
            env.startDate = moment.unix(start).utc();
            env.stopDate = moment.unix(stop).utc();
            env.main.updateCurrentData();
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