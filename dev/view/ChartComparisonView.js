define([
    "lib.d3-magnetic-cursor",
    "env.config",
    "env.utils"
], function(d3, config, utils) {

    var ChartComparisonView = function (env, group) {
        var margin, width, height, x, y, xAxis, yAxis, svg, lines, dots, lineSkeletons, colors, $this, maxProbesPossible,
            marginBottomLastItem, marginBottomNormalItem, chartHeight, dotsRadius, lastDots, usedColors, notUsedColors,
            lastCheckedNumberOfProbes, timePointer, whiteLeftBackground, extraHeight, showDots, popUpTimer, popUpDiv;

        this.group = group;
        this.lastUpdateParams = {};
        $this = this;
        showDots = config.drawDotsOnComparisonCharts;
        marginBottomLastItem = 20;
        marginBottomNormalItem = 4;
        chartHeight = config.singleChartHeight;
        margin = {top: 10, right: 20, left: 60};
        dotsRadius = 3;
        colors = [
            ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"],
            ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"]
        ];
        maxProbesPossible = colors[colors.length-1].length;
        lineSkeletons = {};
        lines = {};
        dots = {};
        usedColors = {};
        notUsedColors = [];

        if (this.group.probes.length > maxProbesPossible){
            throw "It is not useful to show more than " + maxProbesPossible + " probes on the same chart, use more charts or another chart type"
        }


        this.setHeight = function(height){
            chartHeight = height - extraHeight;
            this._update();
        };


        this._getColorsSet = function(size){
            for (var n=0,length=colors.length; n<length; n++){
                if (size <= colors[n].length){
                    return colors[n];
                }
            }
        };

        this._getColor = function(key){
            if (!usedColors[key]){
                usedColors[key] = notUsedColors.pop();
            }

            return usedColors[key];
        };

        this._resetColors = function(){
            var oldColorSet, newColorSet;

            if (lastCheckedNumberOfProbes) {
                oldColorSet = this._getColorsSet(lastCheckedNumberOfProbes);
                newColorSet = this._getColorsSet(this.group.probes.length);
            }
            if (!lastCheckedNumberOfProbes || oldColorSet.length != newColorSet.length) {
                notUsedColors = this._getColorsSet(this.group.probes.length).reverse();
                usedColors = {};
                lastCheckedNumberOfProbes = this.group.probes.length;
            }
        };


        this._getAverageSampleValue = function(sample){ //Compute the real average between min, max, avg
            var values, average;

            values = [];

            if (sample.min){
                values.push(sample.min);
            }
            if (sample.avg){
                values.push(sample.avg);
            }
            if (sample.max){
                values.push(sample.max);
            }

            average = (values.length > 0) ?
                (values.reduce(function(a, b) {
                    return a + b;
                }) / values.length) : null;

            sample.cumulativeValue = (average) ? parseFloat(average.toFixed(2)) : null;

            return sample;
        };


        this.getChartDom = function () {
            var probeDom, infoDom, groupDescription, dragIcon, deleteIcon;

            groupDescription = group.toString();
            probeDom = $('<div class="chart-item probe-multi-chart" id="chart-probe-' + group.id + '"></div>');
            infoDom = $('<div class="probe-multi-info"></div>')
                .height(chartHeight)
                .width(config.probeDescriptionDomWidth);

            dragIcon = $('<img src="' + env.widgetUrl + 'view/img/drag_arrow.png" class="drag-icon"/>');
            deleteIcon = $('<img src="' + env.widgetUrl +'view/img/delete_chart_icon.png" class="delete-icon"/>');

            infoDom.append('<div class="probe-info-line first-line">' +  group.id + '</div>');
            infoDom.append('<div class="probe-info-line" title="' + groupDescription + '">Probes: ' + $.map(groupDescription.split(", "), function(item){return '<span style="color:' + $this._getColor("sample-" + item) + ';">' + item + '</span>';}).join(", ") + '</div>');

            popUpDiv = $('<div class="probe-hover-popup"></div>');

            probeDom.append(infoDom).append(dragIcon).append(deleteIcon).append(popUpDiv);

            deleteIcon.on("click", function(){
                env.main.removeGroup($this.group.id);
            });

            probeDom.resizable({
                minHeight: 100,
                handles: 's',
                animateEasing: "easeOutBounce",
                delay: 150,
                helper: "ui-resizable-helper",
                stop: function(event, ui){
                    $this.setHeight.call($this, $(this).innerHeight());
                    $(this).css("height", "auto");
                }
            });
            return probeDom;
        };


        this.isLast = function () {
            return env.parentDom.find('.chart-item').last().attr('id').replace('chart-probe-', '') == this.group.id
        };


        this.update = function (xDomain, yDomain, yRange, yUnit) {
            var data;

            data = this.group;

            this.lastUpdateParams.xDomain = xDomain;
            this.lastUpdateParams.yDomain = yDomain;
            this.lastUpdateParams.yRange = yRange;
            this.lastUpdateParams.yUnit = yUnit;

            this.updateChart(data, xDomain, yDomain, yRange, yUnit);

            data.forEach(function(probe) {
                var key, probeData;

                key = "sample-" + probe.id;
                probeData = probe.averageFilteredData || $this._getProbeSeries(probe.filteredData);
                $this.updateLine(probeData, key);
                $this.updateDots(probeData, key);
            });

            timePointer
                .attr("y1", 0).attr("y2", height + margin.top);

            whiteLeftBackground
                .attr("height", height + margin.top)

        };

        this._update = function(){
            var xDomain, yDomain, yRange, yUnit;

            xDomain = this.lastUpdateParams.xDomain;
            yDomain = this.lastUpdateParams.yDomain;
            yRange = this.lastUpdateParams.yRange;
            yUnit = this.lastUpdateParams.yUnit;
            this.update(xDomain, yDomain, yRange, yUnit);
        };


        this.updateDots = function (data, key) {

            svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date;
                })
                .attr("class", function(dataPoint){
                    return "dot fill-normal-dot " + key + " p" + $this.group.id;
                })
                .attr("stroke", $this._getColor(key))
                .attr("cx", lineSkeletons[key].x())
                .attr("cy", lineSkeletons[key].y());

            svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date;
                })
                .exit()
                .remove();

            lastDots = svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date;
                })
                .enter()
                .append("circle")
                .attr("class", function(dataPoint){
                    return "dot fill-normal-dot " + key  + " p" + $this.group.id;
                })
                .attr("cx", lineSkeletons[key].x())
                .attr("cy", lineSkeletons[key].y())
                .attr("opacity", function(){
                    return (showDots) ? 1 : 0;
                })
                .attr("r", 15)
                .on("mouseout", function(){
                    $this.hidePopUp();
                });

            lastDots
                .transition()
                .duration(2000)
                .attr("r", 3);
        };


        this.drawLabels = function(data, key){
            var label;

            if (data.length > 0){

                svg
                    .selectAll(".label-" + key)
                    .remove();

                label = svg
                    .append("g")
                    .attr("class", "label-" + key)
                    .attr("transform", "translate(" + Math.max(x(data[0].date), 0) + "," + (y(data[0].cumulativeValue) - 6) + ")")
                    .attr("dy", ".35em");

                label
                    .append("rect")
                    .style("fill", $this._getColor(key))
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("rx", 4)
                    .attr("ry", 4)
                    .attr("width", 40)
                    .attr("height", 11)
                    .text(key.replace("sample-", ""));

                label
                    .append("text")
                    .attr("x", 5)
                    .attr("y", 9)
                    .attr("text-anchor", "start")
                    .style("fill", "white")
                    .text(key.replace("sample-", ""));
            }
        };

        this.updateLine = function (data, key) {

            this.drawLabels(data, key);

            lines[key]
                .datum(data)
                .transition()
                .attr("d", $this.getSvgPath)
                .attr("stroke", $this._getColor(key));
        };


        this.getGraphicalSamples = function(xDomain){
            var globalSeries, probe;

            globalSeries = [];

            for (var n=0,length=this.group.probes.length; n<length; n++){
                probe = this.group.probes[n];
                probe.averageFilteredData = $this._getProbeSeries(probe.filteredData);
                globalSeries = globalSeries.concat(probe.averageFilteredData);
            }

            return globalSeries
        };


        this._getProbeSeries = function(data){
            var samples;

            samples = [];

            for (var n=0,length=data.length; n<length; n++){
                samples.push($this._getAverageSampleValue(data[n]));
            }

            return samples;
        };


        this.draw = function (xDomain, yDomain, yRange, yUnit) {

            this.lastUpdateParams.xDomain = xDomain;
            this.lastUpdateParams.yDomain = yDomain;
            this.lastUpdateParams.yRange = yRange;
            this.lastUpdateParams.yUnit = yUnit;

            this.initChart(this.group, xDomain, yDomain, yRange, yUnit);

            this.group.forEach(function(probe) {
                var key, probeData;

                probeData = probe.averageFilteredData || $this._getProbeSeries(probe.filteredData);
                key = "sample-" + probe.id;
                lineSkeletons[key] = $this.computeLine(probeData, "cumulativeValue");
                lines[key] = $this.drawLine(probeData, key, lineSkeletons[key]);
                dots[key] = $this.drawDots(probeData, key, lineSkeletons[key]);
            });


            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            whiteLeftBackground = svg // White background to cut the x overflows on the left
                .append("rect")
                .attr("transform", "translate(-" + margin.left + ",-4)")
                .attr("height", height + margin.top)
                .attr("fill", "white")
                .attr("width", margin.left);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        };


        this.mapToDomain = function(element){
            var domain, currentElement, diff, newdiff, variation;
            if (this.freeRange){

                return y(element);

            } else {

                domain = this.lastUsedDomain;
                currentElement = domain[0];
                diff = Math.abs(element - currentElement);
                for (var val = 0; val < domain.length; val++) {
                    newdiff = Math.abs(element - domain[val]);
                    if (newdiff < diff) {
                        diff = newdiff;
                        currentElement = domain[val];
                    }
                }

                variation = 0;

                if (currentElement - element > 0){
                    variation = Math.log(currentElement - element + 1);
                }


                return y(currentElement) - (variation);
            }
        };


        this.updateChart = function (data, xDomain, yDomain, yRange, yUnit) {
            var isLast, computedYRange;

            if (this.group.probes.length > 20){
                throw "It is not useful to show more than 20 probes on the same chart, use more charts or another chart type"
            }

            this._resetColors();

            this.lastUsedData = data;
            this.lastUsedDomain = yDomain;
            this.freeRange = (yRange == null);
            isLast = this.isLast();

            if (isLast) {
                margin.bottom = marginBottomLastItem;
                extraHeight = marginBottomLastItem - marginBottomNormalItem;
            } else {
                margin.bottom = marginBottomNormalItem;
                extraHeight = 0;
            }

            width = this.group.dom.innerWidth() - margin.left - margin.right - config.probeDescriptionDomWidth;
            height = chartHeight + extraHeight - margin.top - margin.bottom;

            computedYRange = (yRange) ? $.map(yRange, function(n){return (height/(yRange.length - 1)) * n}) : [height, 0];

            x = d3.time.scale.utc()
                .domain(xDomain)
                .rangeRound([0, width]);

            y = ((yRange) ? d3.scale.ordinal() : d3.scale.linear())
                .domain(yDomain)
                .range(computedYRange);

            if (isLast) {
                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
            } else {
                xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(0)
                    .orient("bottom");
            }

            yAxis = d3.svg.axis()
                .scale(y)
                .ticks(7)
                .innerTickSize(-width)
                .outerTickSize(0)
                .tickFormat(function (d) {
                    return parseFloat(d.toFixed(2)) + yUnit;
                })
                .orient("left");

            d3.select(this.group.dom[0])
                .select("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            svg.select(".x.axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.select(".y.axis").remove();

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        };


        this.initChart = function (data, xDomain, yDomain, yRange, yUnit) {
            var isLast, computedYRange, svgElement;

            isLast = this.isLast();
            this.lastUsedData = data;
            this.lastUsedDomain = yDomain;
            this.freeRange = (yRange == null);

            if (isLast) {
                margin.bottom = marginBottomLastItem;
                extraHeight = marginBottomLastItem - marginBottomNormalItem;
            } else {
                margin.bottom = marginBottomNormalItem;
                extraHeight = 0;
            }

            width = this.group.dom.innerWidth() - margin.left - margin.right - config.probeDescriptionDomWidth;
            height = chartHeight + extraHeight - margin.top - margin.bottom;

            computedYRange = (yRange) ? $.map(yRange, function(n){return (height/(yRange.length - 1)) * n}) : [height, 0];

            x = d3.time.scale.utc()
                .domain(xDomain)
                .rangeRound([0, width]);

            y = ((yRange) ? d3.scale.ordinal() : d3.scale.linear())
                .domain(yDomain)
                .range(computedYRange);

            if (isLast) {
                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
            } else {
                xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(0)
                    .orient("bottom");
            }

            yAxis = d3.svg.axis()
                .scale(y)
                .ticks(7)
                .innerTickSize(-width)
                .outerTickSize(0)
                .tickFormat(function (d) {
                    return parseFloat(d.toFixed(2)) + yUnit;
                })
                .orient("left");

            svgElement = d3
                .select(this.group.dom[0])
                .append("svg");

            svgElement
                .append("rect")
                .attr("class", "selection-rect");

            svgElement
                .attr("class", "chart-svg")
                .on("mousedown", function(){
                    env.selectionOngoing = true;
                    env.selectionStartPoint = d3.mouse(this)[0];
                })
                .on("mouseup", function(){
                    if (env.selectionOngoing) {

                        env.selectionOngoing = false;
                        env.selectionEndPoint = Math.max(Math.min(d3.mouse(this)[0], width + margin.left), margin.left);

                        d3.select(env.parentDom[0])
                            .selectAll(".selection-rect")
                            .style("opacity", 0)
                            .attr("width", 0);

                        if (Math.abs(env.selectionStartPoint - env.selectionEndPoint) > config.minimumPixelSelectable) {
                            env.main.setTimeRange(x.invert(Math.min(env.selectionStartPoint, env.selectionEndPoint)), x.invert(Math.max(env.selectionEndPoint, env.selectionStartPoint)))
                        }
                    }
                })
                .on('mousemove', function () {
                    if (env.selectionOngoing) {
                        env.selectionEndPoint = Math.max(Math.min(d3.mouse(this)[0], width + margin.left), margin.left);

                        d3.select(env.parentDom[0])
                            .selectAll(".selection-rect")
                            .style("opacity", 0.3)
                            .attr("x", Math.min(env.selectionStartPoint, env.selectionEndPoint))
                            .attr("y", 0)
                            .attr("width", Math.abs(env.selectionEndPoint - env.selectionStartPoint))
                            .attr("height", height + margin.top);
                    }
                });

            svg = svgElement
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            timePointer = svgElement
                .append("g")
                .attr("class", "legend-probe")
                .append("svg:line")
                .attr("class", "time-cursor")
                .style("visibility", "hidden")
                .attr("x1", 0).attr("x2", 0)
                .attr("y1", 0).attr("y2", height + margin.top);

            $(this.group.dom)
                .mousemove(function(event) {
                    var closestPath, xPosition, timePointerXPosition, dataSampleHovered;

                    closestPath = d3.magneticPaths.attract(10, lines, [event.pageX - $(this).offset().left - margin.left, event.pageY - $(this).offset().top - margin.top]);

                    d3.selectAll(".comparison-line")
                        .attr("stroke-width", "1px");

                    if (!showDots) {
                        d3 //Remove the others
                            .selectAll(".p" + $this.group.id + ".dot")
                            .attr("opacity", 0);
                    }

                    if (closestPath){
                        closestPath.path.attr("stroke-width", "2px");

                        if (!showDots) {
                            d3 // Show the current selected path's dots
                                .selectAll("." + closestPath.path.attr("id") + ".p" + $this.group.id + ".dot")
                                .attr("opacity", 1);
                        }

                        xPosition = event.pageX - $(this).offset().left - margin.left;
                        dataSampleHovered = $this.getClosestSample(xPosition, $this.lastUsedData);
                        if (dataSampleHovered) {
                            xPosition = dataSampleHovered.drawnX;
                            xPosition = Math.max(xPosition, 0);
                            xPosition = Math.min(xPosition, width + margin.left);
                            timePointerXPosition = xPosition + margin.left + (dotsRadius / 3);

                            d3
                                .selectAll(".time-cursor")
                                .style("visibility", "visible")
                                .attr("x1", timePointerXPosition).attr("x2", timePointerXPosition);

                            $this.showPopUp(timePointerXPosition, dataSampleHovered);

                            d3
                                .selectAll("." + closestPath.path.attr("id") + ".p" + $this.group.id + ".dot[cx=\"" + xPosition + "\"]")
                                .attr("opacity", 1)
                                .attr("r", 7)
                                .transition()
                                .duration(2000)
                                .attr("r", 3);
                        }
                    } else {
                        $this.hidePopUp();
                    }

                })
                .on("mouseout", function(){
                    $this.hidePopUp();
                });

        };

        this.hidePopUp = function(){
            popUpDiv.hide();
            clearTimeout(popUpTimer);
        };


        this.showPopUp = function(x, dataPoint){
            var position, margin;

            margin = config.hoverPopUpMargin;
            position = (x > this.group.dom.width()/2) ? (x - (popUpDiv.outerWidth() + margin)): x + margin;

            popUpDiv.hide();
            clearTimeout(popUpTimer);
            popUpTimer = setTimeout(function(){
                var description;

                popUpDiv.css({
                    left: position,
                    top: (chartHeight - popUpDiv.outerHeight()) / 2
                }).show();

                description = [];
                description.push("Date: " + utils.dateToString(dataPoint.date));
                description.push('<span style="color:' + $this._getColor("sample-" + dataPoint.probe) + ';">Probe ID: ' + dataPoint.probe + '</span>');
                description.push("RTT: " + ((dataPoint.min) ? dataPoint.min.toFixed(2) + " | " : "") + ((dataPoint.avg) ? dataPoint.avg.toFixed(2) + " | " : "") + ((dataPoint.max) ? dataPoint.max.toFixed(2) : ""));
                //description.push("Med: " + dataPoint.avg.toFixed(2));
                //description.push("Max: " + dataPoint.max.toFixed(2));
                if (dataPoint.packetLoss) {
                    description.push("PacketLoss: " + (dataPoint.packetLoss.toFixed(2) * 100) + "%");
                    description.push("" + dataPoint.sent + " packet sent, "+ dataPoint.received + " received");

                }

                popUpDiv.html(description.join("<br>"));
            }, config.hoverPopUpDelay);

        };



        this.getClosestSample = function(xValue, group){
            var distance, smallestDistance, data, sample, closestSample;

            smallestDistance = Infinity;

            group.forEach(function(probe){
                data = probe.filteredData;

                for (var n = 0; n < data.length; n++) {
                    var drawnX;

                    sample = data[n];
                    drawnX = sample.drawnX;
                    distance = (drawnX < xValue) ? xValue - drawnX: drawnX - xValue;

                    if (distance < smallestDistance){
                        closestSample = sample;
                        smallestDistance = distance;
                    }
                }

            });

            return closestSample;
        };


        this.drawDots = function (data, key, line) {

            return svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date;
                })
                .enter()
                .append("circle")
                .attr("class", function(dataPoint){
                    return "dot fill-normal-dot " + key + " p" + $this.group.id;
                })
                .attr("cx", line.x())
                .attr("cy", line.y())
                .attr("r", function(d){
                    d.rendered = true;
                    return dotsRadius;
                })
                .attr("opacity", function(){
                    return (showDots) ? 1 : 0;
                })
                .attr("stroke", $this._getColor(key))
                .on("mouseout", function(){
                    $this.hidePopUp();
                });

        };

        this.getSvgPath = function(elements){
            var pathOut, element, previousElement, startNewPath;

            if (elements.length > 0) {
                startNewPath = false;
                element = elements[0];
                pathOut = 'M' + x(element.date) + ',' + y(element.cumulativeValue);
                previousElement = element;

                for (var n = 1, length = elements.length; n < length; n++) {
                    element = elements[n];
                    if (element.cumulativeValue) {

                        if (element.packetLoss > 0){
                            var q, m, x1, y1, x2, y2, dashSize, xn, yn, previousX, previousY, dashSpace, even,
                                firstSegment, increment, endPoint;

                            dashSize = 3;
                            dashSpace = dashSize * element.packetLoss;

                            x1 = x(previousElement.date);
                            y1 = y(previousElement.cumulativeValue);

                            x2 = x(element.date);
                            y2 = y(element.cumulativeValue);

                            xn = x1;
                            yn = y1;

                            m = (y2 - y1) / (x2 - x1);

                            q = y1 - m * x1;

                            firstSegment = (x2 - x1) / 3;
                            previousX = x1;
                            previousY = y1;

                            xn += firstSegment;

                            even = true;
                            increment = (even) ? dashSize : dashSpace;
                            endPoint = x2 - firstSegment;

                            while (xn + increment < endPoint){
                                xn += increment;
                                yn = (m * xn) + q;

                                if (even) {

                                    pathOut += 'M' + previousX + ',' + previousY + 'L' + xn + ',' + yn;

                                }
                                previousX = xn;
                                previousY = yn;
                                even = !even;
                            }

                            startNewPath = false;
                            pathOut += 'M' + xn + ',' + yn +  'L' + x2 + ',' + y2;

                        } else {
                            pathOut += ((startNewPath) ? 'M' : 'L') + x(element.date) + ',' + y(element.cumulativeValue);
                        }
                        startNewPath = false;
                    } else {
                        startNewPath = true;
                    }

                    previousElement = element;
                }
            }

            return pathOut;
        };

        this.drawLine = function (data, key, line) {

            this.drawLabels(data, key);

            return svg
                .append("path")
                .datum(data)
                .attr("id", key)
                .attr("class", "comparison-line " + key)
                .attr("d", $this.getSvgPath)
                .attr("stroke-width", "1px")
                .attr("stroke", $this._getColor(key))
                .on("mouseover", function(){
                    d3.select(this).attr("stroke-width", "2px");
                })
                .on("mouseout", function(){
                    d3.select(this).attr("stroke-width", "1px");
                });

        };


        this.computeLine = function (data, key) {
            return d3.svg.line()
                .defined(function (dataPoint){
                    return dataPoint[key] != null;
                })
                .x(function (dataPoint) {
                    dataPoint.drawnX = x(dataPoint.date);
                    return dataPoint.drawnX;
                })
                .y(function (dataPoint) {
                    return y(dataPoint[key]);
                    //return $this.mapToDomain(dataPoint[key]);
                });
        };


        this._resetColors();
    };

    return ChartComparisonView;
});