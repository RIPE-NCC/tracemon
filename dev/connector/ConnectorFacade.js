/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "latencymon.env.config",
    "latencymon.env.utils",
    "latencymon.connector.history-auto",
    "latencymon.connector.live"
], function(config, utils, HistoryConnector, LiveConnector) {


    var ConnectorFacade = function (env) {
        var historyConnector, liveConnector, $this;

        $this = this;
        historyConnector = new HistoryConnector(env);
        liveConnector = new LiveConnector(env);

        this.getHistoricalProbesData = function (measurementId, probes, startDate, endDate, callback, context) {

            endDate = endDate || utils.getUTCDate();
            return historyConnector.getHistoricalProbesData(
                measurementId,
                probes,
                utils.dateToUTCTimestamp(startDate),
                utils.dateToUTCTimestamp(endDate),
                function(blob){
                    var indexedProbes, length, n, results;

                    if (blob && blob.data){
                        results = blob.data;
                        indexedProbes = [];
                        env.originalMeasurements[measurementId]["currentResolution"] = blob.resolution;
                        env.originalMeasurements[measurementId]["currentInterval"] = blob.interval;

                        for (n=0, length=probes.length; n<length; n++) {
                            indexedProbes[probes[n].id] = probes[n];
                            probes[n].data = [];
                            //probes[n].filteredData = [];
                        }

                        if (results.length > 0) {

                            for (n=0,length = results.length; n < length; n++) {
                                $this.addNewDataItem(indexedProbes[results[n].prb_id], results[n]);
                            }

                            env.lastHistoricSample = Math.max(results[results.length - 1].timestamp, (env.lastHistoricSample || 0));
                        }

                        if (callback){
                            callback.call(context, probes);
                        }
                    } else {
                        env.main.error("The server responded with an empty data set for the probes " + probes.join(", ") + ". Try again later.");
                    }

                }, this);

        };


        this.unsubscribeToStreamingData = function(measurementId, group){
            var measurementTmp, probesTmp;

            if (group.subscribed) {
                if (!env.measurements[measurementId].merged) {
                    for (var i = 0, lengthI = group.probes.length; i < lengthI; i++) {
                        liveConnector.unsubscribe(measurementId, group.probes[i].id);
                    }

                } else {

                    for (var mergedMsmId in env.measurements[measurementId].mergedList) {

                        measurementTmp = env.measurements[measurementId].mergedList[mergedMsmId];
                        probesTmp = [];
                        for (var p = 0, lengthP = group.probes.length; p < lengthP; p++) {
                            if (measurementTmp.probes.indexOf(group.probes[p].id) != -1) {
                                probesTmp.push(group.probes[p]);
                            }
                        }

                        if (probesTmp.length > 0) {
                            for (var n = 0, length = probesTmp.length; n < length; n++) {
                                liveConnector.unsubscribe(mergedMsmId, probesTmp[n].id);
                            }
                        }

                    }
                }
            }


            group.subscribed = false;

        };


        this.subscribeToStreamingData = function(measurementId, group, callback, context){
            var measurementTmp, probesTmp, socketOptions;

            socketOptions = {
                url: env.streamingUrl,
                path: "/stream/socket.io"
            };

            if (!group.subscribed) {
                if (!env.measurements[measurementId].merged) {
                    for (var i = 0, lengthI = group.probes.length; i < lengthI; i++) {
                        liveConnector.subscribe(measurementId, group.probes[i].id, function (data) {
                                $this._addDataWithEmulation(data, group.id, callback, context);
                            },
                            $this, socketOptions);
                    }

                } else {

                    for (var mergedMsmId in env.measurements[measurementId].mergedList) {

                        measurementTmp = env.measurements[measurementId].mergedList[mergedMsmId];
                        probesTmp = [];
                        for (var p = 0, lengthP = group.probes.length; p < lengthP; p++) {
                            if (measurementTmp.probes.indexOf(group.probes[p].id) != -1) {
                                probesTmp.push(group.probes[p]);
                            }
                        }

                        if (probesTmp.length > 0) {
                            for (var n = 0, length = probesTmp.length; n < length; n++) {
                                liveConnector.subscribe(mergedMsmId, probesTmp[n].id, function (data) {
                                        $this._addDataWithEmulation(data, group.id, callback, context);
                                    },
                                    $this, socketOptions);
                            }
                        }

                    }
                }

                group.subscribed = true;
            }

        };


        this._addDataWithEmulation = function(data, groupId, callback, context){
            var probe, group, lastSampleAt;

            group = env.main.groups[groupId];
            probe = env.main.availableProbes[group.measurementId][data.prb_id];

            if (group && probe) {
                lastSampleAt = probe.data[probe.data.length - 1].added;

                if (!config.addSamplesWithEmulation || utils.getUTCDate().getTime() > (lastSampleAt.getTime() + 1000)) {

                    probe.updateEmulationTiming = 0;
                    $this.addNewDataItem(probe, data);
                    env.template.streamingLed.blink();
                    callback.call(context, data);

                } else {
                    probe.updateEmulationTiming += 3000;
                    setTimeout(function () {
                        $this.addNewDataItem(probe, data);
                        env.template.streamingLed.blink();
                        callback.call(context, data);
                    }, probe.updateEmulationTiming);

                }

            } else {
                env.main.error('This update refers to a probe not in the set of the available probes (group: ' + groupId + ')', "connection-fail");
            }


        };

        this.getMeasurementInfo = function (probe, callback, context) {

            return historyConnector.getMeasurementInfo(probe, function(data){
                callback.call(context, data);
            }, this);
        };


        this._convertDataFormatExternalToInternal = function (data) {
            //var plc = (Math.random() < 0.4);
            //var min = (data.min) ? data.min : null;
            //var avg = (!plc) ? data.avg : null;
            //var max = (!plc) ? data.max : null;

            return {
                min: (data.min != undefined && !isNaN(data.min)) ? data.min : null,
                avg: (data.avg != undefined && !isNaN(data.avg)) ? data.avg : null,
                max: (data.max != undefined && !isNaN(data.max)) ? data.max : null,
                date: utils.timestampToUTCDate(data.timestamp),
                rendered: data.rendered,
                added: data.added,
                probe: data.probe,
                received: data.rcvd,
                sent: data.sent,
                packetLoss: (data.sent - data.rcvd) / data.sent
                //packetLoss: (plc) ? 1 : 0
            };
        };


        window.once = true;
        this.addNewDataItem = function (probe, data) {
            var sample, item;
            //var plc = true || (Math.random() > 0.8);  // to fake packet loss for test purposes

            probe.data = probe.data || [];
            data.rendered = false;
            data.added = new Date();
            data.probe = probe.id;

            sample = this._convertDataFormatExternalToInternal(data);

            // use atlas_backlog_sent to stop checking
            for (var n=probe.data.length - 1; n>=0; n--){
                item = probe.data[n];
                if (item.date == sample.date) {
                    return;
                }

            }

            //if (plc) {
            probe.data.push(sample);

            // At maximum "numberOfSamples" of data points in the queue
            probe.data = probe.data.slice(-env.maxSamplesPerRow);
            probe.data.sort(function(a, b){
                return a.date - b.date;
            });

            //} else{
            //    console.log("skipped", this._convertDataFormatExternalToInternal(data));
            //}
        };
    };

    return ConnectorFacade;

});

