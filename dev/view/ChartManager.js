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
            this.renderOrUpdateAll();
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


        this._isUpdatable = function(){
            if (!this.updatableCache){
                this.updatableCache = this._getUpdatableValue();
            }
            return this.updatableCache;
        };


        this.renderOrUpdateAll = function(){
            if (renderTimeoutAntiFlood){
                clearTimeout(renderTimeoutAntiFlood);
            }
            renderTimeoutAntiFlood = setTimeout($this._renderOrUpdateAll, 1000);
        };

        window.update = this.renderOrUpdateAll;


        this._renderOrUpdateAll = function(){
            var lowerbound, upperbound, bounds, xDomain, yDomain, yRange, yEnvelop, yUnit, groupView, chartKey, probe;

            if (!$.isEmptyObject($this.charts)) {

                for (chartKey in $this.charts) {
                    groupView = $this.charts[chartKey];

                    for (var n = 0, length = groupView.group.probes.length; n < length; n++) {
                        probe = groupView.group.probes[n];

                        if (!probe.data) {
                            probe.data = [];
                            //throw "The API replied with an empty dataset for the probe " + probe.id;
                        }
                        probe.filteredData = env.dataFilter.manipulate(probe.data);
                    }
                }

                xDomain = $this._getXDomain();
                env.startDate = xDomain[0];
                env.endDate = xDomain[1];
                if (env.endDate) {
                    env.timeDomain = [env.timeDomain[0], new Date(Math.max(env.timeDomain[1], env.endDate))];
                }
                bounds = $this._getBounds(xDomain);
                lowerbound = bounds[0];
                upperbound = bounds[1];

                for (chartKey in $this.charts) {
                    groupView = $this.charts[chartKey];
                    for (n = 0, length = groupView.group.probes.length; n < length; n++) {
                        probe = groupView.group.probes[n];
                        probe.filteredData = $this._imposeCut(probe.filteredData, xDomain, lowerbound, upperbound);
                    }
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
                $this.dom.loadingImage.remove();
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
            this.renderOrUpdateAll();
        };


        this.setFilter = function(filterName){
            var filterClass;

            switch(filterName){
                case "natural":
                    filterClass = NaturalRTTFilter;
                    this.yUnit = "ms";
                    this._getYDomainAndRange = this._getYDomainAndRangeOrdinal;
                    break;
                case "relative":
                    filterClass = RelativeRTTFilter;
                    this.yUnit = "%";
                    this._getYDomainAndRange = this._getYDomainAndRangeLinear;
                    break;

            }
            env.dataFilter = new filterClass(env);
            this.renderOrUpdateAll();
        };



        this._getYDomainAndRangeLinear = function (lowerbound, upperbound, xDomain) {
            var maxYvalue, item, minYvalue, chartKey, groupView, data, probe;

            maxYvalue = 0;
            minYvalue = Infinity;

            var manipulateSamples = function(data){
                for (var n = 0, length = data.length; n < length; n++) {
                    item = data[n];
                    maxYvalue = Math.max(maxYvalue, item.min, item.avg, item.max);
                    minYvalue = Math.min(minYvalue, item.min, item.avg, item.max);
                }
            };

            for (chartKey in $this.charts){
                groupView = $this.charts[chartKey];

                data = (groupView.getGraphicalSamples) ? groupView.getGraphicalSamples(xDomain) : [];

                if (data && data.length > 0){
                    manipulateSamples(data);
                } else {
                    for (var n= 0,length=groupView.group.probes.length; n<length ;n++){
                        probe = groupView.group.probes[n];
                        manipulateSamples(probe.filteredData);
                    }
                }
            }

            return {domain: [minYvalue, maxYvalue], unit: this.yUnit};
        };


        this._getYDomainAndRangeOrdinal = function (lowerbound, upperbound, xDomain) {
            var logValue, values, manipulateSamples, value, percentileDomain, roundedLogValue, computedRange, accuracy,
                groupView, data, chartKey, probe;

            values = [];
            percentileDomain = [];

            manipulateSamples = function(data){
                var item;
                for (var n = 0, length = data.length; n < length; n++) {
                    item = data[n];
                    values.push(item.min);
                    values.push(item.max);
                }
            };

            for (chartKey in $this.charts){
                groupView = $this.charts[chartKey];
                data = (groupView.getGraphicalSamples) ? groupView.getGraphicalSamples(xDomain) : [];

                if (data && data.length > 0){
                    //console.log("graphical samples");
                    manipulateSamples(data);
                } else {
                    //console.log("normal samples");
                    for (var n= 0,length=groupView.group.probes.length; n<length ;n++){
                        probe = groupView.group.probes[n];
                        manipulateSamples(probe.filteredData);
                    }
                }

            }

            values = values.sort();

            function computeRange(accuracy) {
                var position, elementWeight, noDuplicates, logarithmicScale, logarithmicCeiledScale;

                noDuplicates = [];
                logarithmicScale = [];
                logarithmicCeiledScale = [];
                elementWeight = [];

                for (var n = 0, length = values.length; n < length; n++) {
                    value = Math.round(values[n] * accuracy) / accuracy;
                    logValue = parseFloat(Math.log(value).toFixed(2));
                    roundedLogValue = Math.ceil(logValue);
                    position = -1;
                    for (var i=0; i<=5 && position==-1; i++){
                        position = logarithmicScale.indexOf(roundedLogValue - i);
                    }

                    if (position == -1 && noDuplicates.indexOf(value) == -1) {
                        noDuplicates.push(value);
                        logarithmicCeiledScale.push(roundedLogValue);
                        logarithmicScale.push(logValue);
                    } else {
                        elementWeight[position] = (!elementWeight[position]) ? 0 : elementWeight[position] + 1;
                    }
                }

                logarithmicScale = logarithmicScale.sort(function (a, b) {
                    return a - b;
                });

                noDuplicates = noDuplicates.sort(function (a, b) {
                    return a - b;
                });

                return [noDuplicates, logarithmicCeiledScale, logarithmicScale, elementWeight]
            }

            accuracy = 100;
            computedRange = computeRange(accuracy);

            while (computedRange[2].length > 10){
                accuracy = accuracy / 2;
                computedRange = computeRange(accuracy);
            }

            for (var n=computedRange[2].length-1; n>= 0; n--) {
                percentileDomain.push(computedRange[3][n] || n);
            }

            return {domain: computedRange[0], range: percentileDomain, unit: this.yUnit};
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
            var maximumElements, forthPercentile, secondPercentile, minimumElement, item, chartKey, groupView, probe;

            maximumElements = [];
            minimumElement = [];

            for (chartKey in $this.charts){
                groupView = $this.charts[chartKey];

                for (var i= 0,lengthi=groupView.group.probes.length; i<lengthi; i++){
                    probe = groupView.group.probes[i];

                    for (var n = 0,length=probe.filteredData.length; n<length; n++){
                        item = probe.filteredData[n];

                        if (item.date >= xDomain[0]) {
                            minimumElement.push(item.min || item.avg || item.max);
                            maximumElements.push(item.max || item.avg || item.min);
                        }
                    }
                }
            }

            minimumElement = minimumElement.sort(function (a, b) {
                return a - b;
            });

            maximumElements = maximumElements.sort(function (a, b) {
                return a - b;
            });

            secondPercentile = Math.floor((minimumElement.length / 100) * 5);
            forthPercentile = Math.floor((maximumElements.length / 100) * 80);

            return [minimumElement[secondPercentile], maximumElements[forthPercentile]];
        };


        this._getXDomain = function () {
            if (this._isUpdatable()) {
                var biggestDate, groupView, chartKey, probe;

                for (chartKey in $this.charts) {
                    groupView = $this.charts[chartKey];

                    for (var i=0,lengthi = groupView.group.probes.length; i < lengthi; i++) {
                        probe = groupView.group.probes[i];
                        for (var n = 0, length = probe.filteredData.length; n < length; n++) {
                            biggestDate = (!biggestDate || biggestDate < probe.filteredData[n].date) ? probe.filteredData[n].date : biggestDate;
                        }
                    }
                }

                return [new Date(biggestDate - (env.timeWindowSize)), biggestDate];
            } else {
                return [env.startDate, env.endDate]
            }
        };


        this._imposeCut = function (data, xDomain, lowerbound, upperbound) {
            var item, dataOut, dataPoint, roundedMin, roundedMax;

            dataOut = [];

            for (var n = 0, length = data.length; n < length; n++) {
                item = data[n];

                if (item.date > xDomain[0]){
                    roundedMin = (item.min) ? parseFloat(item.min.toFixed(2)) : null;
                    roundedMax = (item.max) ? parseFloat(item.max.toFixed(2)) : null;

                    dataPoint = utils.lightClone(item);


                    dataPoint.min = (item.min != null) ? Math.max(lowerbound, Math.min(upperbound, roundedMin)) : null;
                    dataPoint.avg = (item.avg != null) ? Math.max(lowerbound, Math.min(upperbound, item.avg.toFixed(2))) : null;
                    dataPoint.max = (item.max != null) ? Math.max(lowerbound, Math.min(upperbound, roundedMax)) : null;

                    dataPoint.cut = {
                        min: dataPoint.min != roundedMin,
                        max: dataPoint.max != roundedMax
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
            this.renderOrUpdateAll();
        };


        this._fillDomElements = function() {
            if (env.parentDom.find(config.domClasses.chartDomClass).length == 0) {
                this.dom.controllerDiv = $('<div class="controller"></div>');
                this.dom.chartDiv = $('<div class="chart"></div>').hide();
                this.dom.loadingImage = $('<img src="' + env.widgetUrl + 'view/img/loading.gif" class="loading-image">');

                env.parentDom
                    .append(env.template.controlPanel)
                    .append(this.dom.chartDiv)
                    .append(this.dom.loadingImage.hide())
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
                            $this.renderOrUpdateAll();
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