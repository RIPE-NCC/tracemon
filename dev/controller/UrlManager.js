
define([
    "latencymon.env.config",
    "latencymon.env.utils",
    "latencymon.lib.jquery-amd"
], function(config, utils, $){


    var UrlManager = function(env){
        var keyPrefix, $this;
        $this = this;

        keyPrefix = env.parentDom.attr("id") || config.widgetPrefix;


        /* This method reads the parameter in the widget and creates a string resembling the URL*/
        this._getParameterList = function(){
            var out, originalMeasurements, measurements, groups, groupsPrbIds, groupTypes;

            originalMeasurements = Object.keys(env.originalMeasurements);
            measurements = Object.keys(env.measurements);
            groups = env.chartManager.getCurrentChartsOrder();

            groupTypes = [];
            groupsPrbIds = $.map(groups, function(groupId){
                var group = env.main.groups[groupId];
                groupTypes.push(group.type);
                return group.measurementId + "M" + $.map(group.probes, function(prb){return prb.id;}).join(",");
            });

            out = {
                "start": utils.dateToUTCTimestamp(env.startDate),
                "stop": utils.dateToUTCTimestamp(env.endDate),
                "measurements": originalMeasurements.join(","),
                "groups": groups.join(","),
                "groups-component": groupsPrbIds.join("L"),
                "groups-type": groupTypes.join(",")
            };

            if (measurements.length != originalMeasurements.length){
                out["merged"] = measurements.join(",");
            }

            return out;
        };


        /* This method reads the parameter in the URL and creates a configuration */
        this.getConfigurationFromUrl = function(){
            var parametersUrl, configuration, groupsNames, groups, groupsComponent, groupsType;

            parametersUrl = utils.getUrlParameters(keyPrefix);
            configuration = {};

            configuration.startTimestamp = parametersUrl.start;
            configuration.stopTimestamp = parametersUrl.stop;
            if (!configuration.startTimestamp || !configuration.stopTimestamp) {
                throw "Not valid configuration: start and stop time are missing"; // Normal error, not communicated to user
            }
            configuration.timeWindow = null; // It can be 1h, 1w bla bla, just to remember this option
            configuration.measurements = parametersUrl.measurements.split(",");

            if (parametersUrl.merged) {
                configuration.mergedMeasurements = $.map(parametersUrl.merged.split(","), function (item) {
                    return [
                        item.split("-").map(function (id) {
                            return parseInt(id);
                        })
                    ];
                });
            }

            if (parametersUrl.groups) {
                groups = [];
                groupsNames = parametersUrl.groups.replace(/%2C/g, ",").split(",");
                groupsType = parametersUrl["groups-type"].replace(/%2C/g, ",").split(",");
                groupsComponent = parametersUrl["groups-component"].split("L");

                for (var n = 0, length = groupsNames.length; n < length; n++) {
                    var components, probes, measurementId;

                    components = groupsComponent[n].split("M");
                    measurementId = components[0];
                    probes = components[1].replace(/%2C/g, ",").split(",");
                    groups.push({
                        id: groupsNames[n],
                        type: groupsType[n],
                        measurementId: measurementId,
                        probes: probes
                    });
                }

                configuration.groups = groups;
            }

            return configuration;
        };


        this.getCurrentUrl = function(){
            var actualUrl, replaceParameters

            replaceParameters = this._getParameterList();
            actualUrl = utils.getCurrentUrl();
            for (var key in replaceParameters){
                actualUrl = utils.setParam(keyPrefix + "." + key, replaceParameters[key], actualUrl);
            }

            return actualUrl;
        };


        this.updateUrl = function(){
            window.history.replaceState({}, 'latencymon_state', $this.getCurrentUrl());
        };

    };

    return UrlManager;
});