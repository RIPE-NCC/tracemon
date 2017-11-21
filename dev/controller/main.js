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
    "tracemon.controller.source-selection"
], function(config, utils, $, moment, AutonomousSystem, Hop, Host, Measurement, Traceroute, Connector, MainView,
            HistoryManager, SourceSelectionHelper) {

    while(!moment){
        while(!moment.unix){

        }
    }

    var main = function (env) {
        var $this, sourceSelection, initialModelCreated;

        $this = this;
        initialModelCreated = false;
        sourceSelection = new SourceSelectionHelper(env);

        this.exposedMethods = ["on", "getMeasurements", "getCurrentState", "addMeasurement", "persist", "getSvg",
            "addMeasurements", "applyConfiguration", "getSelectedSources", "setSelectedSources", "addSelectedSource",
            "getSources", "setTimeRange", "removeMeasurement", "goTo", "init", "getVersion", "updateData",
            "persistLog", "getHosts", "getSparseHost"];


        this._checkCursorPosition = function(){
            var instant;

            instant = env.finalQueryParams.instant;
            if (!instant || instant.isBefore(env.finalQueryParams.startDate) || instant.isAfter(env.finalQueryParams.stopDate)) {
                
                if (config.startWithLastStatus){
                    env.finalQueryParams.instant = moment.max(env.finalQueryParams.startDate, moment(env.finalQueryParams.stopDate).subtract(config.instantLeftMargin, "s"));
                } else {
                    env.finalQueryParams.instant = env.finalQueryParams.startDate;

                }
            }
        };

        this._checkTimeRangeSize = function(forceRight){
            var maximumTimeRangePossible;

            maximumTimeRangePossible = config.maximumLoadedPeriod * env.metaData.interval;
            if (env.finalQueryParams.stopDate.diff(env.finalQueryParams.startDate, 'seconds', true) > maximumTimeRangePossible){

                if (forceRight){
                    env.finalQueryParams.startDate = moment(env.finalQueryParams.stopDate)
                        .subtract(maximumTimeRangePossible, "seconds");
                } else {
                    env.finalQueryParams.stopDate = moment(env.finalQueryParams.startDate)
                        .add(maximumTimeRangePossible, "seconds");
                }
                env.utils.observer.publish("error", { type: 694, message: config.errors[694] });
            }

            this._checkCursorPosition();
        };

        this._updateFinalQueryParams = function () {
            var initialParams, startDate, stopDate, sourcesAmount, instant, currentTimestamp, now;

            now = moment.utc();
            if (Object.keys(env.loadedMeasurements).length > 0) {

                initialParams = JSON.parse(JSON.stringify(env.queryParams));
                instant = initialParams.instant;

                if (initialParams.stopTimestamp){
                    stopDate = moment.unix(initialParams.stopTimestamp).utc()
                } else if (env.metaData.stopDate){
                    if (env.metaData.stopDate.isAfter(now)){
                        stopDate = moment(now); // stopDate cannot be more than now
                    } else {
                        stopDate = moment(env.metaData.stopDate);
                    }
                } else {
                    currentTimestamp = now.unix();
                    stopDate = moment.unix(parseInt(currentTimestamp / config.defaultTimeRangeGranularity) * config.defaultTimeRangeGranularity).utc();
                }

                startDate = (initialParams.startTimestamp) ? moment.unix(initialParams.startTimestamp).utc() :
                    moment(stopDate).subtract(config.defaultLoadedPeriod * env.metaData.interval, "seconds");

                sourcesAmount = initialParams.defaultNumberOfDisplayedSources || config.defaultNumberOfDisplayedSources;

                env.finalQueryParams = {
                    startDate: startDate,
                    stopDate: stopDate,
                    sources: initialParams.sources || sourceSelection.getInitialSourcesSelection(sourcesAmount),
                    measurements: initialParams.measurements,
                    instant: instant
                };

                this._checkTimeRangeSize();
                this._updateSelectedSources();

            } else {
                env.utils.observer.publish("error", { type: 507, message: config.errors[507] });
            }
        };

        this._newResultsetLoaded = function(measurements){
            var measurement;

            if (!initialModelCreated){
                initialModelCreated = true;
                env.utils.observer.publish("model.ready");
            }

            for (var n=0,length=measurements.length; n<length; n++) {
                measurement = measurements[n];
                if (env.realTimeUpdate) {
                    env.connector.getRealTimeResults(measurement);
                }
            }

            $this._updateMetaData();
        };

        this._updateSelectedSources = function(){

            for (var probeId in env.loadedSources){ // Update source selection boolean
                env.loadedSources[probeId].select = (env.finalQueryParams.sources.indexOf(parseInt(probeId)) > -1);
            }
        };

        this._updateMetaData = function(){
            var measurement, longestTraceroute, longestTracerouteTmp, measurementInterval;

            longestTraceroute = null;
            for (var msmId in env.loadedMeasurements){
                measurement = env.loadedMeasurements[msmId];

                longestTracerouteTmp = measurement.getLongestTraceroute();
                longestTraceroute = ((longestTraceroute && longestTracerouteTmp && longestTracerouteTmp.getLength() < longestTraceroute.getLength())
                        ? longestTraceroute
                        : longestTracerouteTmp) || 0;

                measurementInterval = (measurement.isOneOff) ? config.oneOffInterval : measurement.interval;
                env.metaData = {
                    startDate: (env.metaData.startDate) ?
                        moment.min(measurement.startDate, env.metaData.startDate) :
                        measurement.startDate,
                    stopDate: (measurement.stopDate && env.metaData.stopDate) ?
                        moment.max(measurement.stopDate, env.metaData.stopDate) : measurement.stopDate || null, // Null if no measurements have a stopDate
                    longestTraceroute: longestTraceroute,
                    intervalMax: (!env.metaData.interval) ? measurementInterval : Math.max(measurementInterval, env.metaData.interval),
                    intervalMin: (!env.metaData.interval) ? measurementInterval : Math.min(measurementInterval, env.metaData.interval),
                    interval: (!env.metaData.interval) ? measurementInterval : Math.min(measurementInterval, env.metaData.interval),
                    onlyOneOff: measurement.isOneOff || env.metaData.onlyOneOff
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

                    if (env.utils.getUrlParam("hackid").length > 0){
                        env.queryParams.measurements = $.map((env.utils.getUrlParam("hackid")[0]).split(","), function(item) {
                            return parseInt(item)
                        });
                    }

                    if (env.utils.getUrlParam("hacksource").length > 0){
                        env.queryParams.sources = $.map((env.utils.getUrlParam("hacksource")[0]).split(","), function(item) {
                            return parseInt(item)
                        });
                    }
                    if (env.utils.getUrlParam("hacktime").length > 0){
                        env.queryParams.startTimestamp = (env.utils.getUrlParam("hacktime")[0]).split(",")[0];
                        env.queryParams.stopTimestamp = (env.utils.getUrlParam("hacktime")[0]).split(",")[1];
                    }

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

            env.utils.observer.publish("loading", true);
            newMeasurementsToLoad = [];
            for (var n=0,length= msmsIDlist.length; n<length; n++) { // Find the new measurements
                msmId = msmsIDlist[n];

                if (!env.loadedMeasurements[msmId]){
                    newMeasurementsToLoad.push(msmId);
                    env.finalQueryParams.measurements.push(msmId);
                }
            }

            try {
                env.connector
                    .getMeasurements(newMeasurementsToLoad)
                    .done(function (measurements) {
                        var measurement, source;
                        env.utils.observer.publish("loading", false);

                        for (var n = 0, length = measurements.length; n < length; n++) {
                            measurement = measurements[n];
                            env.loadedMeasurements[measurement.id] = measurement;

                            for (var sourceKey in measurement.sources) {
                                source = measurement.sources[sourceKey];
                                env.loadedSources[source.id] = source;
                            }
                            env.utils.observer.publish("model.measurement:new", measurement);
                        }

                        $this._updateMetaData();
                        if (callback) {
                            callback(msmsIDlist);
                        }
                    });
            } catch (error){
                var errorObj = (error.type) ? error : { type: "uncaught", message: error };
                env.utils.observer.publish("error", errorObj);
                console.log(errorObj);
            }

        };

        this.updateData = function(callback) { // It must use the final params
            var params, measurements;

            params = env.finalQueryParams;
            measurements = $.map(params.measurements, function(msmId){
                return env.loadedMeasurements[msmId];
            });

            try {
                env.utils.observer.publish("loading", true);

                env.connector
                    .getMeasurementsResults(measurements, {
                            startDate: params.startDate,
                            stopDate: params.stopDate,
                            sources: params.sources
                        }
                    ).done(function(measurements){
                    env.utils.observer.publish("loading", false);

                    $this._newResultsetLoaded(measurements);
                    if (callback){
                        callback(measurements);
                    }
                });

            } catch (error){
                var errorObj = (error.type) ? error : { type: "uncaught", message: error };
                env.utils.observer.publish("error", errorObj);
                console.log(errorObj);
            }

        };

        this.getMeasurements = function(){
            return env.loadedMeasurements;
        };

        this.setSelectedSources = function (sources) {
            env.finalQueryParams.sources = sources;
            this.updateData(function(){
                env.historyManager.getCurrentState();
            });
            env.utils.observer.publish("view:probe-set", env.finalQueryParams.sources);
        };

        this.getSelectedSources = function () {
            return env.finalQueryParams.sources;
        };

        this.getSources = function(){
            return env.loadedSources;
        };

        this.addSelectedSource = function (source) {
            var currentSources = env.finalQueryParams.sources;
            if (currentSources.indexOf(source) == -1){
                currentSources.push(source);
                this.setSelectedSources(currentSources);
            } else {
                throw "Source already selected";
            }
        };

        this.addMeasurement = function(msmId, updateData, numberProbesToLoad){
            if (env.loadedMeasurements[msmId]){
                throw "Measurement already loaded";
            }

            this.addMeasurements([msmId], function(){
                if (numberProbesToLoad && numberProbesToLoad > 0){
                    env.finalQueryParams.sources = sourceSelection.getInitialSourcesSelection(numberProbesToLoad);
                }
                if (updateData){
                    $this.updateData(function(){
                        env.historyManager.getCurrentState();
                    });
                }

            });


        };

        this.removeMeasurement = function(msmId){
            if (!env.loadedMeasurements[msmId]){
                throw "The measurement is not loaded";
            }
            delete env.loadedMeasurements[msmId];
            env.utils.observer.publish("model.measurement:remove", msmId);
        };

        this._validateConfiguration = function(conf){
            if ((conf.startTimestamp && !conf.stopTimestamp) || (!conf.startTimestamp && conf.stopTimestamp)){
                throw "500n";
            } else {
                if (conf.startTimestamp > conf.stopTimestamp) {
                    throw "500t";
                }
            }
        };

        this.applyConfiguration = function(conf){

            try {
                this._validateConfiguration(conf)
            } catch(error){
                var errorObj = { type: error, message: config.errors[error] };
                env.utils.observer.publish("error", errorObj);
                console.log(errorObj);
                return;
            }

            env.queryParams = conf;

            this.addMeasurements(env.queryParams.measurements, function () {
                $this._updateFinalQueryParams();
                $this.updateData(function () {
                    env.historyManager.getCurrentState();
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

        this.goTo = function(timestamp){
            env.finalQueryParams.instant = moment.unix(timestamp).utc();
            env.historyManager.getCurrentState();
        };

        this.setTimeRange = function(start, stop) { // Accept timestamps for public API
            env.utils.observer.publish("loading", true);


            if (this._timeRangeTimet) {
                clearTimeout(this._timeRangeTimet);
            }

            this._timeRangeTimet = setTimeout(function(){
                env.utils.observer.publish("loading", false);
                $this._setTimeRange(start, stop);
            }, config.timeRangeSelectionOverflow);

        };

        this._setTimeRange = function(start, stop){ // Accept timestamps for public API
            var forceRight;

            start = moment.unix(start).utc();
            stop = moment.unix(stop).utc();

            forceRight = start.isSame(env.finalQueryParams.startDate);

            env.finalQueryParams.startDate = start;
            env.finalQueryParams.stopDate = stop;

            this._checkTimeRangeSize(forceRight);

            this.updateData(function(){
                env.historyManager.getCurrentState();
            });

            env.utils.observer.publish("view.time-selection:change", {
                startDate: env.finalQueryParams.startDate,
                stopDate: env.finalQueryParams.stopDate
            });
        };

        this.getVersion = function(){
            return env.version;
        };

        this.on = function(event, callback){
            env.utils.observer.subscribe(event, callback, this);
        };

        this.persist = function(){
            if (config.persistLocations) {
                return env.connector.persist();
            } else {
                console.log("This feature has been disabled from the config file");
                return false;
            }
        };
        

        this.init = function(){
            env.connector = new Connector(env);
            env.historyManager = new HistoryManager(env);

            if (!env.onlyCore) {
                env.mainView = new MainView(env);
            }

            if (!env.onlyCore) {
                env.mainView.init();
            }

            this._startProcedure();

        };

        this.persistLog = function(log){
            env.connector.persistLog("external", log);
        };

        this.getSvg = function(){
            return env.mainView.getSvg();
        };
        
        this.getHosts = function () {
            return env.connector.getHosts();
        };

        this.getSparseHost = function (ip) {
            return env.connector.getSparseHost(ip);
        }

    };

    return main;
});