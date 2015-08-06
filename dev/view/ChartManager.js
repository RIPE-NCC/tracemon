define([
    "env.config",
    "env.utils",
    "env.languages.en",
    "lib.jquery-amd",
    "view.chart.singleProbe",
    "view.chart.multiProbe",
    "view.chart.comparison",
    "filter.relative-rtt",
    "filter.natural-rtt"
], function(config, utils, lang, $, ChartSingleProbeView, ChartMultiProbeView, ChartComparisonView, RelativeRTTFilter, NaturalRTTFilter) {


    var ChartManager = function (env) {
        var $this, renderTimeoutAntiFlood;

        $this = this;
        this.dom = {};
        this.yUnit = "%"; // Default unit
        env.dataFilter = new RelativeRTTFilter(env); // Default filter

        this.charts = {};

        this.addChart = function(group){
            var chartViewObject;

            switch(group.type){

                case "single-probe":
                    chartViewObject = new ChartSingleProbeView(env, group);
                    break;

                case "multi-probes":
                    chartViewObject = new ChartMultiProbeView(env, group);
                    break;

                case "comparison":
                    chartViewObject = new ChartComparisonView(env, group);
                    break;

            }

            this.charts["" + group.id] = chartViewObject; // Force cast to string
            group.dom = chartViewObject.getChartDom();
            this.dom.chartDiv.append(group.dom);
            this.updateOrder();
            this.renderOrUpdateAll(true);
        };


        this._getUpdatableValue = function(){
            if (env.updateIfPossible && env.isUpdatable) {
                for (var measurementId in env.originalMeasurements) {
                    if (env.originalMeasurements[measurementId]["currentResolution"] != config.naturalResolution) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

        this.getSmallerResolution = function(){
            var nativeInterval;
            nativeInterval = Infinity;
            for (var measurementId in env.originalMeasurements) {
                nativeInterval = Math.min(env.originalMeasurements[measurementId]["native_sampling"], nativeInterval);
            }

            return nativeInterval;
        };

        this.getGreaterResolution = function(){
            var nativeInterval;
            nativeInterval = 0;
            for (var measurementId in env.originalMeasurements) {
                nativeInterval = Math.max(env.originalMeasurements[measurementId]["native_sampling"], nativeInterval);
            }

            return nativeInterval;
        };


        this._isUpdatable = function(){
            if (!this.updatableCache){
                this.updatableCache = this._getUpdatableValue();
            }
            return this.updatableCache;
        };


        this.renderOrUpdateAll = function(skipAntiFlood){
            if (skipAntiFlood) {

                this._renderOrUpdateAll();

            } else {

                if (renderTimeoutAntiFlood){
                    clearTimeout(renderTimeoutAntiFlood);
                }
                renderTimeoutAntiFlood = setTimeout($this._renderOrUpdateAll, config.antiFloodRedrawCharts);
            }
        };

        this._renderOrUpdateAll = function(){
            var lowerbound, upperbound, bounds, xDomain, yDomain, yRange, yEnvelop, yUnit, groupView, chartKey, probe,
                atLeastOne;

            for (chartKey in $this.charts) { // Apply the data filter to all the probe results
                atLeastOne = true;
                break;
                //
                //groupView = $this.charts[chartKey];
                //
                //for (var n=0,length=groupView.group.probes.length; n<length; n++) {
                //    probe = groupView.group.probes[n];
                //    if (!probe.data) {
                //        probe.data = [];
                //    }
                //    probe.data = env.dataFilter.manipulate2(probe.data);
                //}
            }

            if (atLeastOne) {
                xDomain = $this._getXDomain();
                env.startDate = xDomain[0];
                env.endDate = xDomain[1];
                if (env.endDate) {
                    env.timeDomain = [env.timeDomain[0], new Date(Math.max(env.timeDomain[1], env.endDate))];
                }

                for (chartKey in $this.charts) { // Impose the boundaries to all the groups
                    groupView = $this.charts[chartKey];
                    groupView.samples = env.dataFilter.manipulate(groupView.getGraphicalSamples(xDomain));
                }

                bounds = $this._getBounds(xDomain); // Search che y boundaries to apply to all the groups
                lowerbound = bounds[0];
                upperbound = bounds[1];

                for (chartKey in $this.charts) { // Impose the boundaries to all the groups
                    groupView = $this.charts[chartKey];
                    groupView.samples = $this._imposeCut(groupView.samples, xDomain, lowerbound, upperbound);
                }

                yEnvelop = $this._getYDomainAndRange(lowerbound, upperbound, xDomain);
                yDomain = yEnvelop.domain;
                yRange = yEnvelop.range;
                yUnit = yEnvelop.unit;

                $this.dom.chartDiv.show();
                for (chartKey in $this.charts) {
                    groupView = $this.charts[chartKey];

                    if (!groupView.rendered) {
                        $this._addChartSvg(groupView, xDomain, yDomain, yRange, yUnit);
                    } else {
                        $this._updateChartSvg(groupView, xDomain, yDomain, yRange, yUnit);
                    }

                }

                env.timeOverview.update(env.timeDomain, [env.startDate, env.endDate]);
                env.template.updateInfo();
                env.urlManager.updateUrl();
                $this.applyUpdateCondition();
            }
        };


        this.applyUpdateCondition = function(){
            var chartKey, groupView;

            if (this._isUpdatable()){ // Subscribe to latest updates
                for (chartKey in $this.charts){
                    groupView = $this.charts[chartKey];
                    env.connector.subscribeToStreamingData(groupView.group.measurementId, groupView.group, $this.renderOrUpdateAll, $this);
                }

            } else { // Unsubscribe from latest updates
                for (chartKey in $this.charts){
                    groupView = $this.charts[chartKey];
                    env.connector.unsubscribeToStreamingData(groupView.group.measurementId, groupView.group, $this.renderOrUpdateAll, $this);
                }
            }
        };


        this.applyNewTimeRange = function(){
            this.applyUpdateCondition();
            this.renderOrUpdateAll(true);
        };


        this.setFilter = function(filterName){
            var filterClass;

            switch(filterName){
                case "natural":
                    filterClass = NaturalRTTFilter;
                    this.yUnit = "ms";
                    this._getYDomainAndRange = this._getYDomainAndRangeLinear;

                    //this._getYDomainAndRange = this._getYDomainAndRangeOrdinal;
                    break;
                case "relative":
                    filterClass = RelativeRTTFilter;
                    this.yUnit = "%";
                    this._getYDomainAndRange = this._getYDomainAndRangeLinear;
                    break;

            }
            env.dataFilter = new filterClass(env);
            this.renderOrUpdateAll(true);
        };



        this._getYDomainAndRangeLinear = function (lowerbound, upperbound, xDomain) {
            var maxYvalue, item, minYvalue, chartKey, groupView, data, probe;

            maxYvalue = 0;
            minYvalue = Infinity;

            var manipulateSamples = function(data){
                for (var n = 0, length = data.length; n < length; n++) {
                    item = data[n];

                    if (item.min != null || item.avg != null || item.max != null) {
                        maxYvalue = Math.max(maxYvalue, item.min, item.avg, item.max);
                    }
                    if (item.min != null){
                        minYvalue = Math.min(minYvalue, item.min);
                    }
                }
            };

            for (chartKey in $this.charts){
                groupView = $this.charts[chartKey];
                manipulateSamples(groupView.samples);
            }

            return {domain: [minYvalue, maxYvalue], unit: this.yUnit};
        };


        //this._getYDomainAndRangeOrdinal = function (lowerbound, upperbound, xDomain) {
        //    var logValue, values, manipulateSamples, value, percentileDomain, roundedLogValue, computedRange, accuracy,
        //        groupView, data, chartKey, probe;
        //
        //    values = [];
        //    percentileDomain = [];
        //
        //    manipulateSamples = function(data){
        //        var item;
        //        for (var n=0,length=data.length; n<length; n++) {
        //            item = data[n];
        //            if (item.min != null){
        //                values.push(item.min);
        //            }
        //
        //            if (item.avg != null){
        //                values.push(item.avg);
        //            }
        //
        //            if (item.max != null){
        //                values.push(item.max);
        //            }
        //        }
        //    };
        //
        //    for (chartKey in $this.charts){
        //        groupView = $this.charts[chartKey];
        //        data = groupView.getGraphicalSamples(xDomain);
        //
        //        if (data && data.length > 0){
        //            manipulateSamples(data);
        //        }
        //
        //    }
        //
        //    values = values.sort();
        //
        //    function computeRange(accuracy) {
        //        var position, elementWeight, noDuplicates, logarithmicScale, logarithmicCeiledScale;
        //
        //        noDuplicates = [];
        //        logarithmicScale = [];
        //        logarithmicCeiledScale = [];
        //        elementWeight = [];
        //
        //        for (var n = 0, length = values.length; n < length; n++) {
        //            value = Math.round(values[n] * accuracy) / accuracy;
        //            logValue = parseFloat(Math.log(value).toFixed(2));
        //            roundedLogValue = Math.ceil(logValue);
        //            //roundedLogValue = logValue;
        //            position = -1;
        //            for (var i=0; i<=5 && position==-1; i++){
        //                position = logarithmicScale.indexOf(roundedLogValue - i);
        //            }
        //
        //            if (position == -1 && noDuplicates.indexOf(value) == -1) {
        //                noDuplicates.push(value);
        //                logarithmicCeiledScale.push(roundedLogValue);
        //                logarithmicScale.push(logValue);
        //            } else {
        //                elementWeight[position] = (!elementWeight[position]) ? 0 : elementWeight[position] + 1;
        //            }
        //        }
        //
        //        logarithmicScale = logarithmicScale.sort(function (a, b) {
        //            return a - b;
        //        });
        //
        //        noDuplicates = noDuplicates.sort(function (a, b) {
        //            return a - b;
        //        });
        //
        //        return [noDuplicates, logarithmicCeiledScale, logarithmicScale, elementWeight]
        //    }
        //
        //    accuracy = 10000;
        //    computedRange = computeRange(accuracy);
        //
        //    while (computedRange[2].length > 10){
        //        accuracy = accuracy / 2;
        //        computedRange = computeRange(accuracy);
        //    }
        //
        //    for (var n=computedRange[2].length-1; n>= 0; n--) {
        //        percentileDomain.push(computedRange[3][n] || n);
        //    }
        //
        //    return {domain: computedRange[0], range: percentileDomain, unit: this.yUnit};
        //};




        this._getYDomainAndRangeOrdinal = function(lowerbound, upperbound, xDomain){
            var chartKey, groupView, range, indexedElements, item, roundedElements, roundedItem, roundedElementsNew,
                chartHeight, sumRange, unit, minrange;

            range = [];
            indexedElements = [];
            roundedElements = [];

            function getWeight(key){
                var count = 0;
                for (var n=0,length=indexedElements.length;n<length;n++){
                    if (indexedElements[n] == key){
                        count++;
                    }
                }

                return count;
            }

            function doStuff(item){
                if (item >= 10 && item < 100){
                    roundedItem = Math.round(item / 10) * 10;
                } else if (item < 10){
                    roundedItem = Math.round(item);
                } else {
                    roundedItem = Math.round(item / 100) * 100;
                }

                indexedElements.push(roundedItem);
                if (roundedElements.indexOf(roundedItem) == -1){
                    roundedElements.push(roundedItem);
                }
            }

            for (chartKey in $this.charts){
                groupView = $this.charts[chartKey];

                for (var n=0,length=groupView.samples.length;n<length;n++){
                    item = groupView.samples[n];
                    if (item["min"] != null) doStuff(item["min"]);
                    if (item["avg"] != null) doStuff(item["avg"]);
                    if (item["max"] != null) doStuff(item["max"]);

                }
            }

            roundedElements.sort(function(a, b){
                return a-b;
            });

            roundedElementsNew = [];

            // Prune
            for (var n=0,length=roundedElements.length;n<length;n++){
                if (getWeight(roundedElements[n]) > 2){
                    roundedElementsNew.push(roundedElements[n]);
                    range.push(getWeight(roundedElements[n]));
                }
            }

            //minrange = Math.min.apply(null, range);

            //for (var n=1,length=range.length; n<length; n++){
            //    range[n] -= minrange;
            //}
            range[0] = 0;

            sumRange = range.reduce(function(a, b){
                return a + b;
            }, 0);

            chartHeight = 100;
            unit = chartHeight / sumRange;

            for (var n=0,length=range.length; n<length; n++){
                range[n] *= unit;
            }

            range.sort();

            for (var n=1,length=range.length; n<length; n++){
                range[n] += range[n-1];
            }

            range.reverse();

            return {
                domain: roundedElementsNew,
                range: range,
                unit: this.yUnit
            };

        };

        this._getYDomainAndRange = this._getYDomainAndRangeLinear; // y Axis by default

        this._addChartSvg = function (chartView, xDomain, yDomain, yRange, yUnit) {
            chartView.draw(xDomain, yDomain, yRange, yUnit);
            chartView.rendered = true;
        };

        this._updateChartSvg = function (chartView, xDomain, yDomain, yRange, yUnit) {
            chartView.update(xDomain, yDomain, yRange, yUnit);
        };


        this._getBounds = function (xDomain) {
            var maximumElements, forthPercentile, secondPercentile, minimumElement, item, chartKey, groupView, probe,
                smaples, element;

            maximumElements = [];
            minimumElement = [];

            for (chartKey in $this.charts){
                groupView = $this.charts[chartKey];
                smaples = groupView.samples;
                for (var n = 0,length=smaples.length; n<length; n++){
                    item = smaples[n];

                    if (item.date >= xDomain[0] && item.min != null) {

                        element = item.min;
                        //if (minimumElement.indexOf(element) == -1){
                        minimumElement.push(element);
                        //}
                        element = item.max || item.avg || item.min;
                        //if (minimumElement.indexOf(element) == -1){
                        maximumElements.push(element);
                        //}
                    }
                }

            }

            minimumElement = minimumElement.sort(function (a, b) {
                return a - b;
            });

            maximumElements = maximumElements.sort(function (a, b) {
                return a - b;
            });

            secondPercentile = Math.floor((minimumElement.length / 100) * 20); //5
            forthPercentile = Math.floor((maximumElements.length / 100) * 80) - 1; //80

            return [minimumElement[secondPercentile], maximumElements[forthPercentile]];
        };


        this._getXDomain = function () {
            if (this._isUpdatable()) {
                var biggestDate, groupView, chartKey, probe;

                biggestDate = null;
                for (chartKey in $this.charts) {
                    groupView = $this.charts[chartKey];

                    for (var i=0,lengthi = groupView.group.probes.length; i < lengthi; i++) {
                        probe = groupView.group.probes[i];
                        for (var n = 0, length = probe.data.length; n < length; n++) {
                            if (!biggestDate || biggestDate < probe.data[n].date){
                                biggestDate = probe.data[n].date;
                            }
                        }
                    }
                }

                if (biggestDate === null){
                    return [env.startDate, env.endDate]
                }
                return [new Date(biggestDate - (env.timeWindowSize)), biggestDate];
            } else {
                return [env.startDate, env.endDate]
            }
        };


        this._imposeCut = function (data, xDomain, lowerbound, upperbound) {
            var item, dataOut, dataPoint, roundedMin, roundedMax, roundedAvg;

            dataOut = [];

            for (var n = 0, length = data.length; n < length; n++) {
                item = data[n];

                if (item.date > xDomain[0]){
                    roundedMin = (item.min != null) ? parseFloat(item.min.toFixed(2)) : null;
                    roundedAvg = (item.avg != null) ? parseFloat(item.avg.toFixed(2)) : null;
                    roundedMax = (item.max != null) ? parseFloat(item.max.toFixed(2)) : null;

                    dataPoint = utils.lightClone(item);

                    dataPoint.min = (item.min !== null) ? Math.max(lowerbound, Math.min(upperbound, roundedMin)) : null;
                    dataPoint.avg = (item.avg !== null) ? Math.max(lowerbound, Math.min(upperbound, roundedAvg)) : null;
                    dataPoint.max = (item.max !== null) ? Math.max(lowerbound, Math.min(upperbound, roundedMax)) : null;

                    dataPoint.cut = {
                        min: dataPoint.min != roundedMin,
                        avg: dataPoint.avg != roundedAvg,
                        max: dataPoint.max != roundedMax,

                        pmin: roundedMin,
                        pavg: roundedAvg,
                        pmax: roundedMax
                    };

                    dataOut.push(dataPoint);
                }
            }

            return dataOut;
        };


        this.removeChart = function(group){
            delete this.charts[group.id];
            group.dom.remove();
            env.connector.unsubscribeToStreamingData(group.measurementId, group, $this.renderOrUpdateAll, $this);
            this.updateOrder();
            this.renderOrUpdateAll(true);
        };


        this._fillDomElements = function() {
            if (env.parentDom.find(config.domClasses.chartDomClass).length == 0) {
                this.dom.controllerDiv = $('<div class="controller"></div>');
                this.dom.chartDiv = $('<div class="chart"></div>').hide();


                env.template.dom.main
                    .append(env.template.controlPanel)
                    .append(env.template.infoHeader.container)
                    .append(this.dom.chartDiv)
                    .append(env.template.timeOverview);


                var forwardButton = env.parentDom
                    .find(".forward")
                    .on("click", function(){
                        env.main.setStringTimeRange(config.defaiultTimeWindow);
                    });

                env.template.bindSlidingMenu(forwardButton, env.template.getLastData, 90, 'get-last-data-sliding-panel', function(evt){
                    env.main.setStringTimeRange($(evt.target).text());
                });


                env.parentDom
                    .find(".right")
                    .on("click", function(){
                        var percentage;

                        percentage = Math.ceil((env.endDate.getTime() - env.startDate.getTime()) / 100) * config.zoomFactor;
                        env.main.setTimeRange(new Date(env.startDate.getTime() + percentage), new Date(env.endDate.getTime() + percentage));
                    });

                env.parentDom
                    .find(".left")
                    .on("click", function(){
                        var percentage;

                        percentage = Math.ceil((env.endDate.getTime() - env.startDate.getTime()) / 100) * config.zoomFactor;
                        env.main.setTimeRange(new Date(env.startDate.getTime() - percentage), new Date(env.endDate.getTime() - percentage));
                    });

                env.parentDom
                    .find(".zoom-in")
                    .on("click", function(){
                        var percentage;

                        percentage = Math.ceil((env.endDate.getTime() - env.startDate.getTime()) / 100) * config.zoomFactor;
                        env.main.setTimeRange(new Date(env.startDate.getTime() + percentage), new Date(env.endDate.getTime() - percentage));
                    });


                env.parentDom
                    .find(".zoom-out")
                    .on("click", function(){
                        var percentage;

                        percentage = Math.ceil((env.endDate.getTime() - env.startDate.getTime()) / 100) * config.zoomFactor;
                        env.main.setTimeRange(new Date(env.startDate.getTime() - percentage), new Date(env.endDate.getTime() + percentage));

                    });

                env.parentDom
                    .find(".chart-mode")
                    .on("click", function(){
                        var element = $(this);

                        if (element.is(".relative")){
                            element.removeClass("relative").addClass("natural").attr("title", lang.chartModeTitle.absolute);
                            env.main.setDataFilter("natural");
                        } else {
                            element.removeClass("natural").addClass("relative").attr("title", lang.chartModeTitle.relative);
                            env.main.setDataFilter("relative");
                        }
                    });

                env.parentDom.find(".open-add-line-panel")
                    .on("click", function(){
                        env.template.openAddLineMenu();
                    });

                env.parentDom.find(".open-add-group-panel")
                    .on("click", function(){
                        env.template.openAddGroupMenu();
                    });

                env.parentDom.find(".open-add-measurement-panel")
                    .on("click", function(){
                        env.template.openAddMeasurementPanel();
                    });



                this.dom.chartDiv.sortable(
                    {
                        placeholder: "chart-placeholder",
                        handle: ".drag-icon",
                        stop: function(){
                            $this.updateOrder();
                            $this.renderOrUpdateAll(true);
                        }
                    }
                )
                    .disableSelection();
            }
        };


        this.getCurrentChartsOrder = function(){
            if (!this._cachedOrder) {
                this._cachedOrder = $.map(env.parentDom.find(".chart > .chart-item"), function (i) {
                    return $(i).attr("id").replace("chart-probe-", "");
                });
            }

            return this._cachedOrder;
        };

        this.updateOrder = function(){
            delete this._cachedOrder;
        };

        this._fillDomElements();
    };

    return ChartManager;
});