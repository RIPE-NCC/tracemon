define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.model.autonomousSystem",
    "tracemon.model.hop",
    "tracemon.model.host",
    "tracemon.model.measurement",
    "tracemon.model.traceroute",
    "tracemon.connector.facade",
    "tracemon.view.main",
    "tracemon.controller.history-manager",
    "tracemon.view.templateManager"
], function(config, utils, $, AutonomousSystem, Hop, Host, Measurement, Traceroute, Connector, MainView,
            HistoryManager, TemplateManagerView) {

    var main = function (env) {
        var $this, now, firstTimeInit;

        $this = this;
        this.shownSources = null;

        this.exposedMethods = ["setStringTimeRange", "setTimeRange", "addMeasurementAndGroup", "autoGroupMeasurements",
            "addMeasurement", "addProbes", "addProbe", "addGroup", "removeGroup", "removeProbe", "setDataFilter",
            "mergeMeasurements", "removeMeasurement", "init"];

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
            var measurementsToLoad;

            if (conf.startTimestamp && conf.stopTimestamp){
                env.startDate = moment.unix(conf.startTimestamp).utc();
                env.stopDate = moment.unix(conf.stopTimestamp).utc();
            }

            if (conf.measurements) {
                measurementsToLoad = $.map(conf.measurements, function(item){
                    return { id: item };
                });
                this.updateData(measurementsToLoad);
            }
        };

        this.updateCurrentData = function() {
            var measurementsToLoad;

            env.reset = true;
            measurementsToLoad = $.map(Object.keys(this.loadedMeasurements), function(item){
                return { id: item };
            });
            env.historyManager.reset();
            this.updateData(measurementsToLoad);
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

        this.setSources = function (sources) {

            // if (utils.containsAll(this.shownSources, sources)){ // It's a subset
            //
            //     if (this.shownSources.length - sources.length > config.reloadSourcesDiff){ // Too much difference, reload and recompute the model graph
            //         this.shownSources = sources;
            //         this.updateCurrentData();
            //     } else {
            //         this.shownSources = sources;
            //         // Dont' do anything at this level, hide the sources in the view level
            //     }
            // } else { // It's not a subset, we need more data
            //     this.shownSources = sources;
            //     this.updateCurrentData();
            // }

            this.shownSources = sources;
            this.updateCurrentData();
            utils.observer.publish("view:probe-set", this.shownSources);
        };

        this.updateData = function(measurementsToLoad) {

            this.loadMeasurements(measurementsToLoad, function () { // 3749061, 4471092 (loop on *)
                var deferredArray, deferredQuery;

                $this.shownSources = $this.shownSources || $this.computeInitialSources();
                // env.template.showLoadingImage(true);
                deferredArray = [];
                for (var msmId in $this.loadedMeasurements) {

                    deferredQuery = env.connector
                        .getInitialDump($this.loadedMeasurements[msmId], {
                            startDate: env.startDate,
                            stopDate: env.stopDate,
                            sources: $this.shownSources
                        }).done(function(measurement) {
                            env.historyManager.addMeasurement(measurement);

                            if (config.checkRealtime) {
                                env.connector.getRealTimeResults(measurement, { msm: measurement.id });
                            }
                        });

                    deferredArray
                        .push(deferredQuery);
                }

                $.when
                    .apply($, deferredArray)
                    .then(function(){
                        env.historyManager.getLastState();
                        // env.template.showLoadingImage(false);
                    });

            });
        };

        /*
         * msmList format [{id: 81881, sources: [11,22,99]}]
         */

        this.loadMeasurements = function (msmList, callback) {
            this.loadedMeasurements = {}; // reset

            $.when.apply($, $.map(msmList, function (msm){
                return env.connector
                    .getMeasurementInfo(msm.id, { sources: msm.sources })
                    .done(function (measurement) {
                        if (!env.meta){
                            env.meta = {
                                startDate: Infinity,
                                stopDate: null
                            };
                        }

                        env.meta.startDate = Math.min(measurement.startDate.unix(), env.meta.startDate);
                        if (measurement.stopDate) {
                            env.meta.stopDate = Math.max(measurement.stopDate.unix(), env.meta.stopDate);
                        }
                        $this.loadedMeasurements[measurement.id] = measurement;
                    });
            }))
                .done(callback);
        };


        // If you want to load only a set of traceroutes you need <msmId, sources> for each msmId involved
        // c.getMeasurementInfo(2984884)
        //     .done(function(measurement){
        //
        //
        //         c.getInitialDump(measurement, {
        //             startDate: utils.timestampToUTCDate(parseInt(new Date()/1000) - 3600)
        //         }).done(function(measurement){
        //
        //             c.getRealTimeResults(measurement, {msm: measurement.id});
        //         });
        //     });


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

        this.setTimeRange = function(start, stop){ // Accept timestamps for public API
            env.startDate = moment.unix(start).utc();
            env.stopDate = moment.unix(stop).utc();
            env.main.updateCurrentData();
            utils.observer.publish("view.time-selection:change", { startDate: env.startDate, stopDate: env.stopDate });
        };

        this.init = function(){
            env.connector = new Connector(env);
            env.historyManager = new HistoryManager(env);
            env.template = new TemplateManagerView(env);
            env.mainView = new MainView(env);


            now = utils.getUTCDate();
            this.groups = {};
            firstTimeInit = true;

            // utils.observer.subscribe("init-status", function(){
            //     firstTimeInit = false;
            // }, this);

            this._startProcedure();
            env.template.init();

        };

    };

    return main;
});