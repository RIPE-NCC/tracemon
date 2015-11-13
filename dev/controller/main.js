define([
    "latencymon.env.config",
    "latencymon.env.utils",
    "latencymon.lib.jquery-amd",
    "latencymon.model.group",
    "latencymon.connector.facade",
    "latencymon.view.chartManager",
    "latencymon.view.templateManager",
    "latencymon.view.timeOverview",
    "latencymon.controller.group-manager",
    "latencymon.controller.url-manager",
    "latencymon.lib.jquery-libs"
], function(config, utils, $, Group, ConnectorFacade, ChartManager, TemplateManagerView, TimeOverviewView, GroupManager, UrlManager) {

    var main = function (env) {
        var $this, timeOverviewInitialised, now;

        $this = this;
        now = utils.getUTCDate();
        this.availableProbes = {};
        this.groups = {};

        this.exposedMethods = ["setStringTimeRange", "setTimeRange", "addMeasurementAndGroup", "autoGroupMeasurements",
            "addMeasurement", "addProbes", "addProbe", "addGroup", "removeGroup", "removeProbe", "setDataFilter",
            "mergeMeasurements", "removeMeasurement", "init"];

        env.template = new TemplateManagerView(env);
        env.connector = new ConnectorFacade(env);
        env.chartManager = new ChartManager(env);
        env.groupManager = new GroupManager(env);
        env.urlManager = new UrlManager(env);
        env.timeOverview = new TimeOverviewView(
            {
                margins: config.timeOverviewMargins,
                verticalLabels: true,
                hideIfLessThanSeconds: config.hideTimeOverviewWhenLessThanSeconds,
                granularityLevels: config.brusherBucketLevelsMinutes,
                width: env.parentDom.width(),
                height: config.timeOverviewHeight
            },

            {
                end: function(startDate, endDate, points){
                    env.main.setTimeRange(startDate, endDate);
                },

                interaction: function(startDate, endDate, points){
                    //env.startDate = startDate;
                    //env.endDate = endDate;
                    // do something

                },

                change: function(startDate, endDate, points){
                    // do something


                },

                init: function(startDate, endDate, points){
                    // do something

                }

            });

        timeOverviewInitialised = false;
        env.measurements = {};
        env.originalMeasurements = {};
        env.maxSamplesPerRow = Math.min(config.maxNumberOfSamplesPerRow, Math.floor(env.parentDom.innerWidth() / config.aSampleEveryPixels));

        console.log("Use 'main.addMeasurement(id)' to load a measurement");

        this._isUpdatable = function(){
            var out;
            if (!env.syncWithRealTimeData){
                env.template.streamingLed.off();
                return false;
            }
            if (!env.endDate){
                out = false;
            } else {
                out = env.endDate.getTime() >= (utils.getUTCDate().getTime() - config.updateIfYoungerThanMilliseconds);
            }

            if (out){
                env.template.streamingLed.on();
            } else {
                env.template.streamingLed.off();
            }

            return out;
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

        this.setStringTimeRange = function(string, suppressError){
            var timeOffset, now;

            now = utils.getUTCDate();
            timeOffset = config.predefinedTimeWindows[string];
            if (timeOffset){
                env.main.setTimeRange(new Date(now.getTime() - (timeOffset * 1000)), now, suppressError);
            } else {
                env.main.error("Time range not valid", "error");
            }
        };

        this.setTimeRange = function(startDate, endDate, suppressError){
            var groupTmp, calls, now;

            if (!startDate || endDate && startDate >= endDate){
                env.main.error("Invalid time period", "error");

            } else {

                // Remove the cache for the isUpdatable feature
                delete env.chartManager.updatableCache;

                now = utils.getUTCDate();
                if (endDate && endDate > now){
                    endDate = now;
                }
                if (startDate < env.timeDomain[0]){
                    startDate = env.timeDomain[0];
                }

                if (endDate && env.timeDomain[1] && endDate > env.timeDomain[1]){
                    endDate = env.timeDomain[1];
                }

                if ((config.minNumberOfSamplePerRow * env.chartManager.getSmallerResolution() * 1000) > endDate - startDate){
                    if (!suppressError){
                        env.main.error("Time window too small for this resolution", "error");
                    } else {
                        throw "Time window too small for this resolution"
                    }
                }

                env.startDate = startDate;
                env.endDate = endDate;
                env.isUpdatable = this._isUpdatable();

                calls = [];
                for (var groupId in this.groups) {
                    groupTmp = this.groups[groupId];
                    calls = calls.concat(this.enrichProbes(groupTmp.measurementId, groupTmp.probes));
                }

                $.when.apply(this, calls)
                    .done(function () {
                        env.chartManager.applyNewTimeRange();
                    });

            }

        };

        this.addMeasurementAndGroup = function(measurementId, callback, context){
            this.addMeasurement(measurementId, function(){
                env.groupManager.group();
                if (callback){
                    callback.call(context);
                }
            }, this);

        };

        this.autoGroupMeasurements = function(){
            env.groupManager.group();
        };

        this.addMeasurement = function(measurementId, callback, context, mergeSameTarget){ // if mergeSameTarget is undefined, the default value is chosen
            if (!env.measurements[measurementId]) {
                $this.availableProbes[measurementId] = {};
            } else {
                env.main.error("The measurement is already loaded", "error");
            }

            env.template.showLoadingImage(true);
            return env.connector.getMeasurementInfo(measurementId, function (measurement) {
                var n, length, probe, targets, interval, selectedTimeWindow, maximumPossibleData, mostRecentDate;

                targets = [];
                measurement.target = utils.htmlEncode(measurement.target); // Security check
                measurement.resolutionMap = this._computeResolutionMapForThisMeasurement(measurement);
                console.log("Measurement ID: " + measurementId + " Target: " + measurement.target);
                console.log("You can use the following " + measurement.probes.length + " probes: ", $.map(measurement.probes, function(probe){return probe.id}));
                console.log("Commands available: main.");
                console.log("addProbe(measurementID, probeID)/addGroup(measurementID, [probes], label, 'multi-probes'|'comparison')");
                console.log("setDataFilter('neutral'|'relative')");
                console.log("removeMeasurement(measurementId)/mergeMeasurements([measurementIds], mergeSamples)");
                console.log("setTimeRange(startDate, endDate)");

                mostRecentDate = utils.getUTCDate();

                if (env.timeDomain) {
                    env.timeDomain = [
                        utils.timestampToUTCDate(Math.min(measurement["start_time"], env.timeDomain[0].getTime() / 1000)),
                        utils.timestampToUTCDate(Math.max(measurement["stop_time"], env.timeDomain[1].getTime() / 1000))
                    ];
                } else {
                    env.timeDomain = [
                        utils.timestampToUTCDate(measurement["start_time"]),
                        ((measurement["stop_time"]) ? (utils.timestampToUTCDate(measurement["stop_time"])) : utils.getUTCDate())
                    ];
                }

                if (env.timeDomain[0] > mostRecentDate){
                    env.main.error("The selected measurement will start in the future. Nothing to show for now", "error");
                }

                if (env.timeDomain[1] > mostRecentDate) {
                    env.timeDomain[1] = mostRecentDate;
                }

                interval = measurement["native_sampling"];
                selectedTimeWindow = (interval * env.maxSamplesPerRow * 1000);
                maximumPossibleData = new Date(Math.min(env.timeDomain[1], mostRecentDate));

                // If not defined, set the default selected time window
                if (!env.timeWindowSize){
                    env.startDate = new Date(Math.max(maximumPossibleData.getTime() - selectedTimeWindow, env.timeDomain[0].getTime()));
                    env.endDate = maximumPossibleData;
                    env.timeWindowSize = env.endDate - env.startDate;
                    env.isUpdatable = this._isUpdatable();
                }


                env.measurements[measurementId] = measurement;
                env.originalMeasurements[measurementId] = measurement;

                for (n = 0, length = measurement.probes.length; n < length; n++) {
                    probe = measurement.probes[n];
                    $this.availableProbes[measurementId][probe.id] = probe;
                }

                env.template.showLoadingImage(false);

                if (callback){
                    callback.call(context);
                }

                // Auto merge function
                if ((mergeSameTarget != undefined)? mergeSameTarget : config.autoMergeSameTargetMeasurement) {
                    for (var measurementKey in env.measurements) {
                        targets[env.measurements[measurementKey].target] = targets[env.measurements[measurementKey].target] || [];
                        targets[env.measurements[measurementKey].target].push(env.measurements[measurementKey]["msm_id"]);
                    }

                    for (var target in targets) {
                        if (targets[target].length > 1) {
                            env.main.mergeMeasurements(targets[target], config.autoMergeSamplesSameProbeDifferentMeasurement);
                        }
                    }
                }

                env.template.updateInfo();
                env.urlManager.updateUrl();
            }, this);

        };

        this.enrichProbes = function (msmID, probes, callback, context) {
            var measurementTmp, probesTmp, calls, allProbes;

            env.timeWindowSize = env.endDate - env.startDate;
            env.template.showLoadingImage(true);
            calls = [];

            if (!env.measurements[msmID].merged) {
                calls.push(env.connector.getHistoricalProbesData(msmID, probes, env.startDate, env.endDate, function(data){
                    env.template.showLoadingImage(false);

                    if (callback){
                        callback.call(context, data);
                    }
                }, this));

            } else {

                allProbes = [];
                for (var measurementId in env.measurements[msmID].mergedList){
                    measurementTmp = env.measurements[msmID].mergedList[measurementId];
                    probesTmp = [];
                    for (var p=0,lengthP=probes.length; p<lengthP; p++){
                        if (measurementTmp.probes.indexOf(probes[p].id) != -1){
                            probesTmp.push(probes[p]);
                            allProbes.push(probes[p]);
                        }
                    }

                    if (probesTmp.length > 0){
                        calls.push(env.connector.getHistoricalProbesData(measurementId, probesTmp, env.startDate, env.endDate));
                    }
                }

                $.when.apply(this, calls)
                    .done(function () {
                        env.template.showLoadingImage(false);
                        if (callback) {
                            callback.call(context, allProbes);
                        }
                    });
            }

            return calls;
        };

        this.addProbe = function (msmID, probeId) {
            this.addGroup(msmID, [probeId], this._getGroupLabelFromProbeAndMsm(msmID, probeId), "single-probe");
        };

        this.addProbes = function(msmID, probes){
            for (var n = 0; n < probes.length; n++) {
                this.addProbe(msmID, probes[n])
            }
        };

        this._initTimeOverview = function(){
            env.timeOverview.init(env.template.timeOverview[0], env.timeDomain, [env.startDate, env.endDate]);
        };

        this.addGroup = function(msmID, probeIds, groupLabel, type){
            if (!env.measurements[msmID]){
                env.main.error("The selected measurement has not been loaded yet, use 'addMeasurement' first", "error");
            }

            if (!this.groups[groupLabel]) {
                var probes;

                probes = $.map(probeIds, function (id) {
                    var probeObj;

                    probeObj = $this.availableProbes[msmID][id];

                    if (!probeObj){
                        env.main.error("Probe ID not available in this measurement", "error");
                    }

                    for (var group in $this.groups){
                        if ($this.groups[group].measurementId == msmID && $this.groups[group].contains(probeObj)){
                            env.main.error("The probe " + probeObj.id + " is already involved in another chart for the same measurement", "error");
                        }
                    }

                    return probeObj;
                });

                this.enrichProbes(msmID, probes, function (data) {
                    var group;
                    group = new Group(msmID, groupLabel);
                    group.probes = probes;
                    group.type = type;
                    $this.groups[groupLabel] = group;

                    if (!timeOverviewInitialised){
                        timeOverviewInitialised = true;
                        this._initTimeOverview();
                    }

                    env.chartManager.addChart(group);

                }, this);

                console.log("Use removeProbe(measurementID, probeID)/removeGroup(label) to remove a probe/group chart");
            } else {
                env.main.error("The group name already exists", "error");
            }

        };


        this.removeProbe = function(msmID, probeID){
            this.removeGroup(this._getGroupLabelFromProbeAndMsm(msmID, probeID));
        };


        this.removeGroup = function(groupLabel){
            var group;

            group = this.groups[groupLabel];
            if (group){
                env.chartManager.removeChart(group);
                delete this.groups[groupLabel];
            } else {
                env.main.error("The selected group doesn't exist", "error");
            }

        };


        this.setDataFilter = function(filterName){
            env.dataFilterName = filterName;
            env.chartManager.setFilter(filterName);
        };


        this.getProbeOriginalMeasurement = function(measurementId, probeId){
            var mergedMeasurementProbes, mergedMeasurements, measurementObj;

            measurementObj = env.measurements[measurementId];
            if (measurementObj.merged){
                mergedMeasurements = measurementObj.mergedList;
                for (var measurement in mergedMeasurements){
                    mergedMeasurementProbes = mergedMeasurements[measurement].probes;
                    if (mergedMeasurementProbes.indexOf(probeId) != -1){
                        return env.originalMeasurements[measurement];
                    }
                }
            } else {
                return measurementObj;
            }
        };


        this.mergeMeasurements = function(measurementIds, mergeSamples){
            var newMergedId, measurementFinal, measurementTmp, target, totalProbes, msmId, probe, probesList, n, length,
                realMergedList;

            newMergedId = measurementIds.join("-");
            totalProbes = {};
            probesList = [];

            realMergedList = [];

            for (n=0,length=measurementIds.length; n<length; n++){ // Get the real, not merged, IDs
                msmId = measurementIds[n];
                measurementTmp = env.measurements[msmId];
                if (measurementTmp.merged){
                    realMergedList = realMergedList.concat(Object.keys(measurementTmp.mergedList));
                } else {
                    realMergedList.push(msmId);
                }

            }

            for (n=0,length=realMergedList.length; n<length; n++){
                msmId = realMergedList[n];
                measurementTmp = env.originalMeasurements[msmId];

                if (!measurementTmp){
                    env.main.error("You have to load the measurement " + msmId + " first", "error");
                }

                if (target && measurementTmp.target != target){
                    env.main.error("You cannot merge measurements pointing to different targets", "error");
                } else {
                    target = target || measurementTmp.target;
                    if (!measurementFinal){
                        measurementFinal = measurementTmp;
                        measurementFinal.mergedList = {};
                    }
                }
                measurementFinal.mergedList[msmId] = {probes: []};

                if (measurementTmp.native_sampling > measurementFinal.native_sampling){
                    measurementFinal.resolutionMap = measurementTmp.resolutionMap;
                    measurementFinal.native_sampling = measurementTmp.native_sampling
                }

                measurementFinal.start_time = Math.min(measurementFinal.start_time, measurementTmp.start_time);
                measurementFinal.stop_time = Math.max(measurementFinal.stop_time, measurementTmp.stop_time);

                for (var probeId in this.availableProbes[msmId]){
                    probe = this.availableProbes[msmId][probeId]; // One of the probe

                    measurementFinal.mergedList[msmId].probes.push(probe.id);

                    if (!totalProbes[probeId]) { // This probe is new for the set

                        probesList.push(probe); // Probes, list format
                        totalProbes[probeId] = probe; // Probes, map format

                    } else if (!mergeSamples){ // Don't merge samples

                        env.main.error("It is not possible to merge measurements having probes in common. Try mergeSamples=true", "error");

                    }
                }

                measurementFinal.start_time = (measurementFinal.start_time < measurementTmp.start_time) ? measurementFinal.start_time : measurementTmp.start_time;
                measurementFinal.stop_time = (measurementFinal.stop_time > measurementTmp.stop_time) ? measurementFinal.stop_time : measurementTmp.stop_time;
                delete env.measurements[msmId];
                delete this.availableProbes[msmId];
            }

            measurementFinal.merged = true;
            measurementFinal.msm_id = newMergedId;
            measurementFinal.probes = probesList;
            this.availableProbes[newMergedId] = totalProbes;
            env.measurements[newMergedId] = measurementFinal;
        };


        this.removeMeasurement = function(measurementId){

            if (env.measurements[measurementId]) {
                for (var group in this.groups) {
                    group = this.groups[group];
                    if (group.measurementId == measurementId) {
                        env.chartManager.removeChart(group);
                    }
                }

                delete $this.availableProbes[measurementId];
                delete env.measurements[measurementId];
            } else {
                env.main.error("The selected measurement has not been loaded yet.", "error");
            }
        };


        this._getGroupLabelFromProbeAndMsm = function(msmID, probeID){
            return msmID + "-" + probeID;
        };


        this._computeResolutionMapForThisMeasurement = function(measurement){
            var aggregations;

            aggregations = measurement["aggregation_levels"];

            /* The input source has a strange way to describe the available resolutions */
            /* Reminder: */
            aggregations[measurement["native_sampling"]] = config.naturalResolution;
            delete aggregations["0"];

            return aggregations;
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
                            $this.autoGroupMeasurements();
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
            this._startProcedure();
        };

    };

    return main;
});