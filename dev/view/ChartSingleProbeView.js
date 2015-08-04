define([
    "lib.d3",
    "env.config",
    "env.utils",
    "lib.jquery-amd"
], function(d3, config, utils, $) {

    var ChartSingleProbeView = function (env, group) {
        var margin, width, height, x, y, xAxis, yAxis, svg, areas, lines, dots, lineSkeletons, areaSkeletons, $this,
            marginBottomLastItem, marginBottomNormalItem, chartHeight, dotsRadius, probe, popUpDiv, popUpTimer, lastDots,
            whiteLeftBackground, extraHeight, timePointer;

        this.group = group;
        this.lastUpdateParams = {};
        this.measurement = env.main.getProbeOriginalMeasurement(this.group.measurementId, this.group.probes[0].id);
        $this = this;
        marginBottomLastItem = 20;
        marginBottomNormalItem = 4;
        chartHeight = config.singleChartHeight;
        margin = {top: 10, right: 20, left: 60};
        dotsRadius = 3;
        probe = this.group.probes[0];
        lineSkeletons = {};
        areaSkeletons = {};
        areas = {};
        lines = {};
        dots = {};

        this.getChartDom = function () {
            var probeDom, infoDom, asnRendered, dragIcon, deleteIcon;

            asnRendered = false;
            probeDom = $('<div class="chart-item probe-single-chart" id="chart-probe-' + this.group.id + '"></div>');
            infoDom = $('<div class="probe-single-info"></div>')
                .height(chartHeight)
                .width(config.probeDescriptionDomWidth);

            dragIcon = $('<img src="' + env.widgetUrl +'view/img/drag_arrow.png" class="drag-icon"/>');
            deleteIcon = $('<img src="' + env.widgetUrl +'view/img/delete_chart_icon.png" class="delete-icon"/>');

            infoDom.append('<div class="probe-info-line first-line">Probe ' +  probe.id + ' (' + probe.country_code + ')</div>');
            //infoDom.append('<div class="probe-info-line">Country: ' +  probe.country_code + '</div>');

            if (probe.address_v4){
                infoDom.append('<div class="probe-info-line">IP v4: ' +  probe.address_v4 + '</div>');
            }

            if (probe.address_v6){
                infoDom.append('<div class="probe-info-line">IP v6: ' +  probe.address_v6 + '</div>');
            }

            if (probe.asn_v4 == probe.asn_v6 || (!probe.asn_v6 && probe.asn_v4) || (probe.asn_v6 && !probe.asn_v4)){
                infoDom.append('<div class="probe-info-line">AS: ' +  probe.asn_v4 + '</div>');
                asnRendered = true;
            }

            if (probe.prefix_v4){
                infoDom.append('<div class="probe-info-line">Prefix v4: ' +  probe.prefix_v4 + ((!asnRendered) ? ' on AS' + probe.asn_v4 : '') + '</div>');
            }

            if (probe.prefix_v6){
                infoDom.append('<div class="probe-info-line">Prefix v6: ' +  probe.prefix_v6 + ((!asnRendered) ? ' on AS' + probe.asn_v6 : '') + '</div>');
            }
            infoDom.append('<div class="probe-info-line">Target: ' + env.measurements[this.group.measurementId].target + '</div>');

            popUpDiv = $('<div class="probe-hover-popup"></div>');
            probeDom.append(infoDom).append(dragIcon).append(deleteIcon).append(popUpDiv);

            deleteIcon.on("click", function(){
                env.main.removeProbe($this.group.measurementId, $this.group.probes[0].id);
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
            return env.parentDom.find('.chart-item').last().attr('id').replace('chart-probe-', '') == this.group.id;
        };


        this.setHeight = function(height){
            chartHeight = height - extraHeight;
            this._update();
        };


        this._update = function(){
            var xDomain, yDomain, yRange, yUnit;

            xDomain = this.lastUpdateParams.xDomain;
            yDomain = this.lastUpdateParams.yDomain;
            yRange = this.lastUpdateParams.yRange;
            yUnit = this.lastUpdateParams.yUnit;
            this.update(xDomain, yDomain, yRange, yUnit);
        };


        this.update = function (xDomain, yDomain, yRange, yUnit) {
            var data;

            data = this.samples;
            this.lastUpdateParams.xDomain = xDomain;
            this.lastUpdateParams.yDomain = yDomain;
            this.lastUpdateParams.yRange = yRange;
            this.lastUpdateParams.yUnit = yUnit;

            this.updateChart(data, xDomain, yDomain, yRange, yUnit);

            this._computePacketLossSpots(data);
            data = this._addUndefinedPoints(data);
            this.updatePacketLoss(data);

            this.updateLine(data, "min");
            this.updateLine(data, "avg");
            this.updateLine(data, "max");

            this.updateArea(data, "min");
            this.updateArea(data, "avg");
            this.updateArea(data, "max");

            this.updateDots(data, "max");
            this.updateDots(data, "avg");
            this.updateDots(data, "min");

            timePointer
                .attr("y1", 0).attr("y2", height + margin.top);

            whiteLeftBackground
                .attr("height", height + margin.top)
        };


        this._computePacketLossSpots = function(data){
            var  sample1, sample2, interval;
            $this.emptySpot = [];
            for (var n=0,length=data.length; n<length - 1; n++){
                sample1 = data[n];
                sample2 = data[n + 1];

                interval = $this.measurement["currentInterval"];
                if (sample1.packetLoss == 1){
                    $this.emptySpot.push({pre: sample1.date, post: new Date(sample1.date.getTime() + (interval * 1000))});
                }

                if (sample2.packetLoss == 1){
                    $this.emptySpot.push({pre: new Date(sample2.date.getTime() - (interval * 1000)), post: sample2.date});
                }
            }
        };


        this.updatePacketLoss = function(data){
            var line, allLines, allAreas;

            line = lineSkeletons["min"];

            allAreas = svg
                .selectAll(".packet-loss-area")
                .data($this.emptySpot);

            allAreas
                .exit()
                .remove();

            allAreas
                .enter()
                .append("rect")
                .attr("class", "packet-loss-area")
                .attr("fill", "url(#pattern-pl-single)");

            allAreas
                .attr("x", function(dataSample) {
                    return x(dataSample.pre);
                })
                .attr("y", 0)
                .attr("width", function(dataSample) {
                    return x(dataSample.post) - x(dataSample.pre);
                })
                .attr("height", height + "px");



            allLines = svg
                .selectAll(".packet-loss-line")
                .data(data, function(dataPoint){
                    return dataPoint.date;
                });

            allLines
                .exit()
                .remove();

            allLines
                .enter()
                .append("line")
                .filter(function(dataSample){
                    return dataSample.packetLoss > 0.1;
                })
                .attr("class", "packet-loss-line")
                .attr("stroke-dasharray", 5.10)
                .style("opacity", function(dataSample){
                    return dataSample.packetLoss;
                });


            allLines
                .attr("x1", line.x())
                .attr("y1", 0)
                .attr("x2", line.x())
                .attr("y2", height + "px");

        };

        this.updateDots = function (data, key) {
            var allDots;

            allDots = svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date.getTime();
                });

            allDots
                .exit()
                .remove();

            lastDots = allDots
                .enter()
                .append("circle")
                .filter(function(dataPoint){
                    return dataPoint[key] !== null;
                })
                .attr("r", 15)
                .transition()
                .duration(2000)
                .attr("r", 3);


            allDots
                .attr("class", function(dataPoint){
                    if (!dataPoint.cut || !dataPoint.cut[key]){
                        return "dot fill-normal-dot " + key + " p" + dataPoint.probe;
                    } else {
                        return "dot fill-cut-dot " + key + " p" + dataPoint.probe;
                    }
                })
                .attr("cx", lineSkeletons[key].x())
                .attr("cy", lineSkeletons[key].y());

        };

        this.getGraphicalSamples = function(xDomain){
            return probe.data;
        };

        this.updateLine = function (data, key) {
            lines[key]
                .datum(data)
                .transition()
                .attr("d", lineSkeletons[key]);
        };


        this.updateArea = function (data, key) {
            areas[key]
                .datum(data)
                .transition()
                .attr("d", areaSkeletons[key]);
        };


        this.draw = function (xDomain, yDomain, yRange, yUnit) {
            var data;

            data = this.samples;
            this.lastUpdateParams.xDomain = xDomain;
            this.lastUpdateParams.yDomain = yDomain;
            this.lastUpdateParams.yRange = yRange;
            this.lastUpdateParams.yUnit = yUnit;

            this.initChart(data, xDomain, yDomain, yRange, yUnit);

            this._computePacketLossSpots(data);
            data = this._addUndefinedPoints(data);

            lineSkeletons = {
                min: this.computeLine(data, "min"),
                avg: this.computeLine(data, "avg"),
                max: this.computeLine(data, "max")
            };

            areas = {
                min: this.drawArea(data, "min", lineSkeletons["min"]),
                avg: this.drawArea(data, "avg", lineSkeletons["avg"]),
                max: this.drawArea(data, "max", lineSkeletons["max"])
            };

            /*
             * Reverse order
             */
            lines = {
                max: this.drawLine(data, "max", lineSkeletons["max"]),
                avg: this.drawLine(data, "avg", lineSkeletons["avg"]),
                min: this.drawLine(data, "min", lineSkeletons["min"])
            };


            /*
             * Reverse order
             */

            this.updatePacketLoss(data);
            dots = {
                max: this.drawDots(data, "max", lineSkeletons["max"]),
                avg: this.drawDots(data, "avg", lineSkeletons["avg"]),
                min: this.drawDots(data, "min", lineSkeletons["min"])
            };




            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            whiteLeftBackground = svg // White background to cut the x overflows on the left
                .append("rect")
                .attr("transform", "translate(-" + margin.left + ",-4)")
                .attr("height", height + 8)
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

            if ($("#pattern-pl-single").length == 0){
                svg
                    .append("defs")
                    .append("pattern")
                    .attr("id", "pattern-pl-single")
                    .attr("patternUnits", "userSpaceOnUse")
                    .attr("width", 5)
                    .attr("height", 10)
                    .append("image")
                    .attr("xlink:href", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDUgMTAnPgoJPHJlY3Qgd2lkdGg9JzExMCUnIHg9Jy01JScgeT0nLTUlJyBoZWlnaHQ9JzExMCUnIGZpbGw9JyNmZmZmZmYnLz4KCTxsaW5lIHgxPSctMicgeTE9JzEnIHgyPSc3JyB5Mj0nMTAnIHN0cm9rZT0nI2U2NDM0Mycgc3Ryb2tlLXdpZHRoPScwLjI2Jy8+Cgk8bGluZSB4MT0nLTInIHkxPSc2JyB4Mj0nNycgeTI9JzE1JyBzdHJva2U9JyNlNjQzNDMnIHN0cm9rZS13aWR0aD0nMC4yNicvPgoJPGxpbmUgeDE9Jy0yJyB5MT0nLTQnIHgyPSc3JyB5Mj0nNScgc3Ryb2tlPScjZTY0MzQzJyBzdHJva2Utd2lkdGg9JzAuMjYnLz4KPC9zdmc+")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 5)
                    .attr("height", 10);
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

            if ($("#pattern-pl-single").length == 0){
                svg
                    .append("defs")
                    .append("pattern")
                    .attr("id", "pattern-pl-single")
                    .attr("patternUnits", "userSpaceOnUse")
                    .attr("width", 5)
                    .attr("height", 10)
                    .append("image")
                    .attr("xlink:href", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDUgMTAnPgoJPHJlY3Qgd2lkdGg9JzExMCUnIHg9Jy01JScgeT0nLTUlJyBoZWlnaHQ9JzExMCUnIGZpbGw9JyNmZmZmZmYnLz4KCTxsaW5lIHgxPSctMicgeTE9JzEnIHgyPSc3JyB5Mj0nMTAnIHN0cm9rZT0nI2U2NDM0Mycgc3Ryb2tlLXdpZHRoPScwLjI2Jy8+Cgk8bGluZSB4MT0nLTInIHkxPSc2JyB4Mj0nNycgeTI9JzE1JyBzdHJva2U9JyNlNjQzNDMnIHN0cm9rZS13aWR0aD0nMC4yNicvPgoJPGxpbmUgeDE9Jy0yJyB5MT0nLTQnIHgyPSc3JyB5Mj0nNScgc3Ryb2tlPScjZTY0MzQzJyBzdHJva2Utd2lkdGg9JzAuMjYnLz4KPC9zdmc+")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 5)
                    .attr("height", 10);
            }

            timePointer = svgElement
                .append("g")
                .attr("class", "legend-probe")
                //.attr("transform", "translate(" + margin.left + ",0)")
                .append("svg:line")
                .attr("class", "time-cursor")
                .style("visibility", "hidden")
                .attr("x1", 0).attr("x2", 0)
                .attr("y1", 0).attr("y2", height + margin.top);

            $(this.group.dom)
                .mousemove(function(event) {
                    var xPosition, timePointerXPosition, dataSampleHovered;

                    xPosition = event.pageX - $(this).offset().left - margin.left;
                    dataSampleHovered = $this.getClosestSample(xPosition, $this.lastUsedData);

                    if (dataSampleHovered) {
                        xPosition = dataSampleHovered.drawnX;
                        xPosition = Math.max(xPosition, 0);
                        xPosition = Math.min(xPosition, width + margin.left);
                        timePointerXPosition = xPosition + margin.left + (dotsRadius / 3);

                        d3
                            .select(env.parentDom[0])
                            .selectAll(".time-cursor")
                            .style("visibility", "visible")
                            .attr("x1", timePointerXPosition).attr("x2", timePointerXPosition);

                        $this.showPopUp(timePointerXPosition, dataSampleHovered);

                        d3
                            .select(env.parentDom[0])
                            .selectAll(".p" + probe.id + ".dot[cx=\"" + xPosition + "\"]")
                            .attr("r", 7)
                            .transition()
                            .duration(2000)
                            .attr("r", 3);
                    }
                })
                .mouseout(function(event){
                    $this.hidePopUp();
                });

        };


        this.getClosestSample = function(xValue, data){
            var distance, smallestDistance, closestSample, sample;

            smallestDistance = Infinity;

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
            return closestSample;
        };


        this.drawArea = function (data, key, line) {
            areaSkeletons[key] = d3
                .svg
                .area()
                .defined(line.defined())
                .x(line.x())
                .y1(line.y())
                .y0(function (dataPoint) {
                    var lowerPoint;

                    switch (key) {
                        case 'min':
                            lowerPoint = height;
                            break;

                        case 'avg':
                            lowerPoint = $this.mapToDomain(dataPoint['min']);
                            break;

                        case 'max':
                            lowerPoint = $this.mapToDomain(dataPoint['avg']);
                            break;
                    }

                    return lowerPoint;
                });


            return svg
                .append("path")
                .datum(data)
                .attr("class", "area " + key)
                .attr("d", areaSkeletons[key]);
        };


        this.drawDots = function (data, key, line) {

            var enterSet = svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date;
                })
                .enter();


            enterSet
                .append("circle")
                .filter(function(dataPoint){
                    return dataPoint[key] !== null;
                })
                .attr("class", function(dataPoint){
                    if (!dataPoint.cut[key]){
                        return "dot fill-normal-dot " + key + " p" + dataPoint.probe;
                    } else {
                        return "dot fill-cut-dot " + key + " p" + dataPoint.probe;
                    }
                })
                .attr("cx", line.x())
                .attr("cy", line.y())
                .attr("r", function(d){
                    d.rendered = true;
                    return dotsRadius;
                });

            return enterSet;
        };


        this.drawLine = function (data, key, line) {
            return svg
                .append("path")
                .datum(data)
                .attr("class", "line " + key)
                .attr("d", line);
        };




        this._addUndefinedPoints = function(data){
            var currentPoint, nextPoint, newDataSet, fakePoint, measurement, resolutionPeriod;

            newDataSet = [];
            resolutionPeriod = this.measurement["currentInterval"];

            for (var n=0,length=data.length; n<length-1; n++){
                currentPoint = data[n];
                nextPoint = data[n + 1];

                newDataSet.push(currentPoint);
                if ((nextPoint.date.getTime() - currentPoint.date.getTime()) > ((resolutionPeriod * 3)/2 * 1000)){
                    fakePoint = {
                        date: new Date(currentPoint.date.getTime() + 10000),
                        rcvd: 0,
                        sent: 0,
                        min: null,
                        max: null,
                        avg: null
                    };
                    newDataSet.push(fakePoint)
                }
                newDataSet.push(nextPoint);
            }

            return newDataSet;
        };



        this.computeLine = function (data, key) {

            return d3.svg.line()
                .defined(function (dataPoint) {
                    return dataPoint !=null && dataPoint[key] != null;
                })
                .x(function (dataPoint) {
                    dataPoint.drawnX = x(dataPoint.date);
                    return dataPoint.drawnX;
                })
                .y(function (dataPoint) {
                    return $this.mapToDomain(dataPoint[key]);
                });
        };


        this.showPopUp = function(x, dataPoint){
            var position, margin, rounding;

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

                if (dataPoint.original) {
                    if (dataPoint.original.max != null && dataPoint.max != null) {
                        rounding = (dataPoint.cut.max) ? ((dataPoint.max < dataPoint.cut.pmax)? ">" : "<") : false;
                        description.push('<span class="info-label max">Max: ' + dataPoint.original.max.toFixed(2) + 'ms (' +  ((rounding) ? rounding : "") + dataPoint.max.toFixed(2) + '%)</span>');
                    }
                    if (dataPoint.original.avg != null && dataPoint.avg != null) {
                        rounding = (dataPoint.cut.avg) ? ((dataPoint.avg < dataPoint.cut.pavg)? ">" : "<") : false;
                        description.push('<span class="info-label avg">Med: ' + dataPoint.original.avg.toFixed(2) + 'ms (' +  ((rounding) ? rounding : "") + dataPoint.avg.toFixed(2) + '%)</span>');
                    }
                    if (dataPoint.original.min != null && dataPoint.min != null) {
                        rounding = (dataPoint.cut.min) ? ((dataPoint.min < dataPoint.cut.pmin)? ">" : "<") : false;
                        description.push('<span class="info-label min">Min: ' + dataPoint.original.min.toFixed(2) + 'ms (' +  ((rounding) ? rounding : "") + dataPoint.min.toFixed(2) + '%)</span>');
                    }
                }
                if (dataPoint.packetLoss != null) {
                    description.push("Packet loss: " + (dataPoint.packetLoss.toFixed(2) * 100) + "%");
                }
                description.push("" + dataPoint.sent + " packet sent, "+ dataPoint.received + " received");


                popUpDiv.html(description.join("<br>"));
            }, config.hoverPopUpDelay);

        };


        this.hidePopUp = function(){
            popUpDiv.hide();
            clearTimeout(popUpTimer);
        };

    };

    return ChartSingleProbeView;
});