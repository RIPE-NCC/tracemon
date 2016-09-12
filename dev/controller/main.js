define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.model.facade",
    "tracemon.model.autonomousSystem",
    "tracemon.model.hop",
    "tracemon.model.host",
    "tracemon.model.measurement",
    "tracemon.model.traceroute",
    "tracemon.connector.facade",
    "tracemon.view.main",
    "tracemon.controller.history-manager",
    "tracemon.view.templateManager"
], function(config, utils, $, Facade, AutonomousSystem, Hop, Host, Measurement, Traceroute, Connector, MainView,
            HistoryManager, TemplateManagerView) {

    var main = function (env) {
        var $this, timeOverviewInitialised, now, firstTimeInit;

        $this = this;
        env.historyManager = new HistoryManager(env);
        env.template = new TemplateManagerView(env);
        now = utils.getUTCDate();
        this.availableProbes = {};
        this.groups = {};
        this.inputSelection = {};
        firstTimeInit = true;

        utils.observer.subscribe("init-status", function(){
            firstTimeInit = false;
        }, this);

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
            var measurementCounter, callsAddMeasurements;

            if (conf.dataFilter){
                this.setDataFilter(conf.dataFilter);
            }

            if (conf.startTimestamp && conf.stopTimestamp){
                if (!env.timeDomain){
                    env.startDate = utils.timestampToUTCDate(conf.startTimestamp);
                    env.endDate = utils.timestampToUTCDate(conf.stopTimestamp);
                    env.timeWindowSize = env.endDate - env.startDate;
                    env.isUpdatable = this._isUpdatable();
                } else {
                    $this.setTimeRange(utils.timestampToUTCDate(conf.startTimestamp), utils.timestampToUTCDate(conf.stopTimestamp));
                }
            } else if (conf.timeWindow){
                $this.setStringTimeRange(conf.timeWindow);
            } else { // No string time window, not time defined, use a reasonable time range

            }

            if (conf.measurements) {
                measurementCounter = 0;
                callsAddMeasurements = [];
                for (var n = 0, lengthMeasurements = conf.measurements.length; n < lengthMeasurements; n++) {
                    callsAddMeasurements.push($this.addMeasurement(conf.measurements[n], function () {
                        measurementCounter++;
                    }, this, false));
                }

                $.when.apply(this, callsAddMeasurements)
                    .done(function () {
                        if (conf.mergedMeasurements) {
                            for (var m = 0, lengthMerge = conf.mergedMeasurements.length; m < lengthMerge; m++) {
                                $this.mergeMeasurements(conf.mergedMeasurements[m], true);
                            }
                        }

                        if (conf.groups) {
                            for (var g = 0, lengthGroups = conf.groups.length; g < lengthGroups; g++) {
                                var groupTmp = conf.groups[g];
                                $this.addGroup(groupTmp.measurementId, groupTmp.probes, groupTmp.id, groupTmp.type);
                            }
                        }

                        if (!conf.mergedMeasurements && !conf.groups && env.autoStartGrouping){
                            $this.autoGroupMeasurements(env.groupingType);
                        }
                    });

            }
            // DONT DELETE THIS IS A GOOD SORTING FUNCTION
            //setTimeout(function() {
            //    console.log("eseguito");
            //    for (var g=0,lengthGroups=conf.groups.length; g<lengthGroups-1; g++) {
            //        console.log('#chart-probe-' + conf.groups[g].id, '#chart-probe-' + conf.groups[g + 1].id);
            //        $('#chart-probe-' + conf.groups[g].id).insertBefore($('#chart-probe-' + conf.groups[g + 1].id));
            //    }
            //}, 20000);


        };

        var main = new MainView(env);
        var c = new Connector(env);

        env.connector = c; // TODO: Temporary, refactor!


        /*
         * msmList format [{id: 81881, sources: [11,22,99]}]
         */

        this.loadMeasurements = function (msmList, callback) {
            this.loadedMeasurements = {}; // reset

            $.when.apply($, $.map(msmList, function (msm){
                return c
                    .getMeasurementInfo(msm.id, {sources: msm.sources})
                    .done(function (measurement) {
                        $this.loadedMeasurements[measurement.id] = measurement;
                    });
            }))
                .done(callback);
        };





        this.loadMeasurements([{id: 4471092}], function (){ // 3749061, 4471092 (loop on *)

            // env.template.showLoadingImage(true);

            for (var msmId in $this.loadedMeasurements) {
                console.log($this.loadedMeasurements[msmId]);

                c.getInitialDump($this.loadedMeasurements[msmId], {
                    // startDate: utils.timestampToUTCDate(1462250698),
                    startDate: utils.timestampToUTCDate(1470318491),
                    // stopDate: utils.timestampToUTCDate(1462270698)
                    stopDate: utils.timestampToUTCDate(1470322091)
                }).done(function (measurement) {
                    env.historyManager.addMeasurement(measurement);

                    // env.template.showLoadingImage(false);

                    utils.observer.publish("new-measurement", measurement);
                    if (config.checkRealtime) {
                        c.getRealTimeResults(measurement, {msm: measurement.id});
                    }
                    });
            }

        });


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

        this.init = function(){

        };

    };

    return main;
});