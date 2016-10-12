
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.lib.jquery-amd"
], function(utils, config, $){

    var latencyMonAdapter = function(env){

        this.instance = null;
        this.shell = null;

        this.setListeners = function(){
            utils.observer.subscribe("new-measurement", this.addMeasurement, this);
        };

        this._getInterface = function(){
            if (!this.shell){
                try {
                    this.shell = this.instance.shell();
                } catch(error){
                    throw "Impossible to load LatencyMON or to get access to the shell: " + error;
                }
            }

            return this.shell;
        };


        this.addMeasurement = function(measurement){
            var interface;

            try {
                interface = this._getInterface();
                interface.addMeasurement(measurement.id);
                interface.mergeMeasurements(Object.keys(env.main.loadedMeasurements), false);
            } catch(e){
            }
            console.log("runned");
        };

        this.setTimeRange = function(start, stop){
            var interface;

            try {
                interface = this._getInterface();
                interface.setTimeRange(start.toDate(), stop.toDate());
            }catch(e){

            }
        };

        this.init = function(whereClass, measurements, probes){
            if (initLatencymon){
                this.instance = initLatencymon(
                    whereClass,
                    {
                        dataApiMeta: "https://atlas.ripe.net/api/v2/measurements/0000/routequake/meta.jsonp",
                        dev: true,
                        onlyChartMode: true,
                        autoStart: false,
                        showMinimumByDefault: true,
                        onTimeRangeChange: function(start, stop){
                            console.log("Time Range changed: " + start + ' - ' +  stop);
                        },
                        autoStartGrouping: true,
                        permalinkEnabled: false
                    }, {
                        startTimestamp: env.startDate.unix(),
                        stopTimestamp: env.stopDate.unix(),
                        measurements: measurements,
                        dataFilter: "natural",
                        mergedMeasurements: [measurements],
                        groups: [{
                            measurementId: measurements.join("-"),
                            probes: $.map(probes, function(probe){return parseInt(probe);}),
                            id: "all",
                            type: "multi-probes"
                        }]
                    });

            } else {
                console.log("LatencyMON not loaded: no RTT charts available");
            }


            window.latencymon = this.instance;
        };

        this.setListeners();
    };


    return latencyMonAdapter;
});