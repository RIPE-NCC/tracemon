
define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment"
], function(config, $, moment){

    var latencyMonAdapter = function(env){

        this.instance = null;
        this.shell = null;
        this.measurementId = null; // Grouped ID
        this.enabled = (typeof window.initLatencymon != "undefined" && !env.onlyGraph);

        this.setListeners = function(){
            env.utils.observer.subscribe("model.measurement:new", this.addMeasurement, this);
            env.utils.observer.subscribe("view.current-instant:change", this.updateTimeCursor, this);
            env.utils.observer.subscribe("view.time-selection:change", this.setTimeRange, this);
            env.utils.observer.subscribe("view:probe-set", this.updateProbeSet, this);

        };

        this.updateProbeSet = function (set) {
            var interface;

            try {
                interface = this._getInterface();
                interface.removeGroup("all");
                interface.addGroup(this.measurementId, set, "all", "multi-probes");
            }catch(e){
            }
        };

        this.updateTimeCursor = function () {
            var interface;

            try {
                interface = this._getInterface();
                var m = moment(env.finalQueryParams.instant);
                interface.updateExternalTimeCursor(m.unix());
            } catch(e){
                console.log(e);
            }
        };


        this._getInterface = function(){
            if (!this.shell){
                try {
                    this.shell = this.instance.shell();
                } catch(error){
                    console.log("Impossible to load LatencyMON or to get access to the shell: " + error);
                }
            }

            return this.shell;
        };


        this.addMeasurement = function(measurement){
            var interface;

            try {
                interface = this._getInterface();
                interface.addMeasurement(measurement.id);
                interface.mergeMeasurements(Object.keys(env.loadedMeasurements), false);
            } catch(e){
            }
        };

        this.setTimeRange = function(){
            var interface, start, stop;

            start = env.finalQueryParams.startDate;
            stop = env.finalQueryParams.stopDate;
            try {
                interface = this._getInterface();
                interface.setTimeRange(start.toDate(), stop.toDate());
            }catch(e){
            }
        };

        this.init = function(whereClass, measurements, probes){
            if (!env.metaData.onlyOneOff) {
                if (this.enabled) {
                    this.measurementId = measurements.join("-");
                    this.instance = initLatencymon(
                        whereClass,
                        {
                            dev: env.dev,
                            onlyChartMode: true,
                            autoStart: true,
                            showMinimumByDefault: true,
                            onTimeRangeChange: function (start, stop) {
                                env.main.setTimeRange(moment(start).unix(), moment(stop).unix())
                            },
                            onTimeSelection: function (date) {
                                var m = moment(date);
                                env.historyManager.setCurrentInstant(m.add(m.utcOffset(), 'm').utc());
                            },
                            autoStartGrouping: true,
                            permalinkEnabled: false
                        }, {
                            startTimestamp: env.finalQueryParams.startDate.unix(),
                            stopTimestamp: env.finalQueryParams.stopDate.unix(),
                            measurements: measurements,
                            dataFilter: "natural",
                            externalTimeCursor: env.finalQueryParams.instant.utc().unix(),
                            mergedMeasurements: [measurements],
                            groups: [{
                                measurementId: this.measurementId,
                                probes: $.map(probes, function (probe) {
                                    return parseInt(probe);
                                }),
                                id: "all",
                                type: "multi-probes"
                            }]
                        });

                } else {
                    env.utils.observer.publish("error", {
                        type: 603,
                        message: config.errors[603]
                    });
                }
            } else {
                this.remove(whereClass);
            }
        };

        this.remove = function (whereClass) {
            env.parentDom.find(whereClass).add(".legend_latencymon").remove();
        };
        
        this.setListeners();
    };


    return latencyMonAdapter;
});