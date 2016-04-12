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
], function(config, utils, $, Facade, AutonomousSystem, Hop, Host, Measurement, Traceroute, Connector, MainView) {

    var main = function (env) {
        var $this, timeOverviewInitialised, now;

        $this = this;
        now = utils.getUTCDate();
        this.availableProbes = {};
        this.groups = {};

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


        c.getMeasurementInfo(2984884)
            .done(function(measurement){

                c.getInitialDump(measurement, {
                    startDate: utils.timestampToUTCDate(parseInt(new Date()/1000) - 3600)
                }).done(function(measurement){

                    var unoACaso = measurement.getLastState()["332"];
                    console.log(measurement.getLastState()["332"], measurement.getStateAt(unoACaso.date)["332"]);
                    // console.log(measurement.getTraceroutes(parseInt(new Date()/1000) - 360));
                    //
                    // try {
                    //     data[0]
                    //         .hops[0]
                    //         .getAttempts()[0]
                    //         .host
                    //         .getAutonomousSystems()
                    //         .done(function (asn) {
                    //             console.log("asn", asn);
                    //         });
                    // } catch(e){
                    //
                    // }

                    // c.getHostReverseDns(data[0].probe)
                    //     .done(function(domain){
                    //         console.log(domain);
                    //     });
                    //
                    // c.getGeolocation(data[0].probe)
                    //     .done(function(geoloc){
                    //         console.log(geoloc);
                    //     });


                });
            });


        //
        // c.getAutonomousSystem("41.138.32.15")
        //    .done(function(data){
        //        console.log(data);
        //    });


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