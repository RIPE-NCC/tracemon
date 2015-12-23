
define([
    "latencymon.env.config",
    "latencymon.lib.jquery-amd"
], function(config, $){

    var GroupManager = function(env){

        this._getTargets = function(){
            var targets = [];
            for (var msmID in env.measurements) {
                var target = env.measurements[msmID].target;
                if (targets.indexOf(target) == -1) {
                    targets.push(target);
                }
            }

            return targets;
        };

        this._getMeasurementsIds = function(){
            var ids = [];
            for (var msmID in env.originalMeasurements) {
                ids.push(msmID);
            }

            return ids;
        };


        this.groupByCountry = function(targets, minimumProbesPerGroup, maximumProbesPerGroup, minimumGroupNumber, maximumNumberOfGroups){
            var groups, countryCode, probe, cleanGroups;

            groups = {};
            cleanGroups = {};


            if (targets.length == 1){ // Grouping is applicable

                for (var msmID in env.measurements) {
                    for (var n=0,length=env.measurements[msmID].probes.length; n<length; n++){
                        probe = env.measurements[msmID].probes[n];
                        countryCode = probe.country_code;

                        if (!groups[countryCode]){
                            groups[countryCode] = []
                        }
                        groups[countryCode].push(probe);
                    }
                }

                // Enforce minimumProbesPerGroup (error next check)

                for (countryCode in groups){
                    if (groups[countryCode].length >= minimumProbesPerGroup){
                        cleanGroups[countryCode] = groups[countryCode];
                    }
                }

                // Enforce minimumGroupNumber
                if (Object.keys(cleanGroups).length < minimumGroupNumber){
                    throw "It is not possible to create enough groups";
                }

                // Apply the merge
                if (Object.keys(env.measurements).length > 1) {
                    env.main.mergeMeasurements(Object.keys(env.measurements), config.autoMergeSamplesSameProbeDifferentMeasurement);
                }

                for (countryCode in cleanGroups){
                    if (maximumNumberOfGroups <= 0){
                        break;
                    }
                    env.main.addGroup(
                        Object.keys(env.measurements)[0],
                        $.map(cleanGroups[countryCode], function(item){return item.id}).slice(0, maximumProbesPerGroup),
                        this._getLabel(countryCode),
                        "multi-probes");
                    maximumNumberOfGroups--;
                }


            } else {
                throw "Grouping by country not possible";
            }

        };


        this._getLabel = function(label){

            for (var replacement in env.groupingLabelReplace){
                label = label.replace(replacement, env.groupingLabelReplace[replacement]);
            }

            return label;
        };

        this.groupByFirstProbes = function(numberOfProbes) {
            var probe;

            for (var msmID in env.measurements) {
                for (var n=0,length=env.measurements[msmID].probes.length; n<length; n++) {
                    if (numberOfProbes <= 0) {
                        break;
                    }
                    probe = env.measurements[msmID].probes[n];
                    env.main.addProbe(msmID, probe.id);
                    numberOfProbes--;
                }
            }
        };


        this.groupByTarget = function(targets, maximumNumberOfGroups, maximumProbesPerGroup){
            var target, probe, measurement, group;

            if (targets.length > 1){ // Grouping is applicable

                for (var msmID in env.measurements) {
                    measurement = env.measurements[msmID];
                    target = measurement.target;
                    group = [];

                    for (var n=0,length=measurement.probes.length; n<length; n++){
                        probe = measurement.probes[n];
                        group.push(probe);
                    }

                    if (maximumNumberOfGroups <= 0){
                        break;
                    }

                    env.main.addGroup(
                        msmID,
                        $.map(group, function(item){return item.id}).slice(0, maximumProbesPerGroup),
                        this._getLabel(target),
                        "multi-probes");

                    maximumNumberOfGroups--;
                }



            } else {
                throw "Grouping by target is not possible";
            }
        };


        this.groupByMeasurement = function(maximumNumberOfGroups, maximumProbesPerGroup){
            var probe, measurement, group;

            if (Object.keys(env.originalMeasurements).length > 1){ // grouping is applicable
                for (var msmID in env.originalMeasurements) {
                    measurement = env.originalMeasurements[msmID];
                    group = [];

                    for (var n=0,length=measurement.probes.length; n<length; n++){
                        probe = measurement.probes[n];
                        group.push(probe);
                    }

                    if (maximumNumberOfGroups <= 0){
                        break;
                    }

                    env.main.addGroup(
                        msmID,
                        $.map(group, function(item){return item.id}).slice(0, maximumProbesPerGroup),
                        this._getLabel(msmID),
                        "multi-probes");

                    maximumNumberOfGroups--;
                }

            } else {
                throw "Grouping by measurement is not possible"
            }
        };

        this.group = function(type){
            var targets;

            targets = this._getTargets();

            if (type) {
                switch (type) {
                    case "target":
                        this.groupByTarget(targets, config.maximumNumberOfGroups, config.maximumProbesPerGroup);
                        break;

                    case "country":
                        this.groupByCountry(targets, config.minimumProbesPerGroup, config.maximumProbesPerGroup, config.minimumGroupNumber, config.maximumNumberOfGroups);
                        break;

                    case "measurement":
                        this.groupByMeasurement(config.maximumNumberOfGroups, config.maximumProbesPerGroup);
                        break;

                    case "basic":
                        this.groupByFirstProbes(config.numberOfSpareProbes);
                        break;
                }
            } else {

                try {

                    try {
                        this.groupByTarget(targets, config.maximumNumberOfGroups, config.maximumProbesPerGroup);
                    } catch (error) {
                        this.groupByCountry(targets, config.minimumProbesPerGroup, config.maximumProbesPerGroup, config.minimumGroupNumber, config.maximumNumberOfGroups);
                    }

                } catch (error) {
                    this.groupByFirstProbes(config.numberOfSpareProbes);
                }

            }
            env.template.updateInfo();
            env.urlManager.updateUrl();
        }
    };

    return GroupManager; //singleton
});