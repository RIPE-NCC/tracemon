define([
    "lib.d3",
    "env.config",
    "env.utils",
    "lib.jquery-amd"
], function(d3, config, utils, $) {

    var ChartMultiProbeView = function (env, group) {
        var margin, width, height, x, y, xAxis, yAxis, svg, areas, lines, dots, lineSkeletons, areaSkeletons, $this,
            marginBottomLastItem, marginBottomNormalItem, chartHeight, dotsRadius, popUpDiv, popUpTimer, extraHeight,
            timePointer, whiteLeftBackground, averageSeriesCache, lastTimeWindow,
            lastDomainRedrawn, currentSeries;

        this.group = group;
        this.lastUpdateParams = {};
        $this = this;
        marginBottomLastItem = 20;
        marginBottomNormalItem = 4;
        chartHeight = config.singleChartHeight;
        margin = {top: 10, right: 10, left: 60};
        dotsRadius = 3;
        lineSkeletons = {};
        areaSkeletons = {};
        areas = {};
        lines = {};
        dots = {};
        averageSeriesCache = [];


        this._getAllDataPointsMixed = function(){
            var allSamples, probe;

            allSamples = [];

            for (var i= 0,lengthi=this.group.probes.length; i<lengthi; i++){
                probe = this.group.probes[i];
                allSamples = allSamples.concat(probe.data);
            }

            return allSamples;
        };


        this.getGroupInterval = function(){ // Get the maximum interval among all the intervals
            var mainMeasurement, intervals;

            mainMeasurement = env.measurements[this.group.measurementId];
            intervals = [];

            if (!mainMeasurement.merged){
                return mainMeasurement["currentInterval"];
            } else {

                for (var msm in mainMeasurement.mergedList){
                    intervals.push(env.originalMeasurements[msm]["currentInterval"]);
                }

                return Math.max.apply(null, intervals);
            }
        };

        /*
         * Warning, this big function computes the average trend based on multiple discrete trends not aligned on any
         * coordinates by subdividing the trends in a number of buckets defined by the maximum sample allowed by the
         * config file. The average value is computed on each bucket (without synchronizing on a coordinate).
         * This strategy is more accurate and extremely more performing than a synchronized re-sampling of the trends.
         * It is more accurate because we try to keep low the number of samples and with the re-sampling we
         * will have only "far" samples hiding possible peaks. The buckets strategy instead requires less computation power
         * and it doesn't hide variations (they are smoothed, in the worst case).
         */

        this._averageSeries = function(xDomain){
            var bucketLength, allSamples, buckets, sample, dataOut, startTime, tmpSample, sampleTime, bucketsKeys,
                computedDate, computedSample, minValues, avgValues, maxValues, packetLoss, originalMin, originalAvg,
                originalMax, endTime, bucketKey, maxBucket, subStartTime, subEndTime, halfBucket, bucketOffset,
                bucketKeys, bucket;

            dataOut = [];
            startTime = parseInt(xDomain[0].getTime()/1000);
            endTime = parseInt(xDomain[1].getTime()/1000);
            allSamples = this._getAllDataPointsMixed();
            buckets = {};

            bucketLength = this.getGroupInterval();

            subStartTime = parseInt(startTime - (startTime % bucketLength) + bucketLength);
            subEndTime = parseInt(endTime - (endTime % bucketLength));


            maxBucket = subStartTime;
            //buckets[startTime] = [];
            bucketKeys = [];

            if (startTime != subStartTime){ // Creating start bucket
                buckets[startTime] = [];
                bucketKeys.push(startTime);
            }

            while (maxBucket < subEndTime){ // Creating all the buckets
                buckets[maxBucket] = [];
                bucketKeys.push(maxBucket);
                maxBucket += bucketLength;
            }

            if (endTime != subEndTime){ // Creating end bucket
                buckets[subEndTime] = [];
                bucketKeys.push(subEndTime);
            }

            for (var d=0,length=allSamples.length; d<length; d++){ //for all the samples
                sample = allSamples[d]; //The current sample
                sampleTime = parseInt(sample.date.getTime() / 1000);
                bucketKey = parseInt(sampleTime - (sampleTime % bucketLength));

                if (sampleTime < subStartTime){
                    bucketKey = startTime;
                }

                if (sampleTime > subEndTime) {
                    bucketKey = subEndTime;
                }

                if (buckets[bucketKey]) {
                    buckets[bucketKey].push(sample);
                }
            }

            halfBucket = (bucketLength / 2);
            //bucketKeys = Object.keys(buckets).sort();

            for (var l=0,lengthl=bucketKeys.length; l<lengthl; l++){ // Compute the average for each bucket

                bucket = parseInt(bucketKeys[l]);
                if (l == 0){ // First bucket
                    bucketOffset = (subStartTime - startTime) / 2;
                } else if (l == lengthl - 1){ // Last bucket
                    bucketOffset = (endTime - subEndTime) / 2;
                }else{
                    bucketOffset = halfBucket;
                }

                computedDate = new Date((bucket + bucketOffset) * 1000);

                minValues = [];
                avgValues = [];
                maxValues = [];

                originalMin = [];
                originalAvg = [];
                originalMax = [];

                packetLoss = [];

                for (var d= 0,length=buckets[bucket].length; d < length; d++) { //for all the samples in the bucket

                    tmpSample = buckets[bucket][d];

                    if (tmpSample["min"] != null){
                        minValues.push(tmpSample["min"]);
                        //originalMin.push(tmpSample.original["min"]);
                    }
                    if (tmpSample["avg"] != null){
                        avgValues.push(tmpSample["avg"]);
                        //originalAvg.push(tmpSample.original["avg"]);
                    }
                    if (tmpSample["max"] != null){
                        maxValues.push(tmpSample["max"]);
                        //originalMax.push(tmpSample.original["max"]);
                    }

                    packetLoss.push(tmpSample.packetLoss);

                }

                //if ( buckets[bucket].length == 0) {
                //
                //    computedSample = {
                //        date: computedDate,
                //        rcvd: 0,
                //        sent: 0,
                //        min: null,
                //        max: null,
                //        avg: null
                //    };
                //
                //    dataOut.push(computedSample);
                //
                //} else {

                computedSample = this._computeAvgSample(minValues, avgValues, maxValues, originalMin, originalAvg, originalMax, computedDate, packetLoss);
                if (computedSample.min !== null || computedSample.avg !== null || computedSample.max !== null || computedSample.packetLoss == 1) {
                    dataOut.push(computedSample);
                }

                //}
            }

            return {data: dataOut, bucketLength: bucketLength, allSamples: allSamples, lastBucketKey: bucketKeys[bucketKeys.length - 1]};
        };


        this._computeAvgSample = function(minValues, avgValues, maxValues, originalMin, originalAvg, originalMax, computedDate, packetLossArray){
            var computedMin, computedAvg, computedMax, fakeSample, packetLoss, computedOriginalMin,
                computedOriginalAvg, computedOriginalMax;

            computedMin = (minValues.length > 0) ?
                (minValues.reduce(function(a, b) {
                    return a + b;
                }) / minValues.length) : null;

            computedAvg = (avgValues.length > 0) ?
                (avgValues.reduce(function(a, b) {
                    return a + b;
                }) / avgValues.length) : null;

            computedMax = (maxValues.length > 0) ?
                (maxValues.reduce(function(a, b) {
                    return a + b;
                }) / maxValues.length) : null;


            computedOriginalMin = (originalMin.length > 0) ?
                (originalMin.reduce(function(a, b) {
                    return a + b;
                }) / originalMin.length) : null;

            computedOriginalAvg = (originalAvg.length > 0) ?
                (originalAvg.reduce(function(a, b) {
                    return a + b;
                }) / originalAvg.length) : null;

            computedOriginalMax = (originalMax.length > 0) ?
                (originalMax.reduce(function(a, b) {
                    return a + b;
                }) / originalMax.length) : null;




            packetLoss = (packetLossArray.length > 0) ?
                (packetLossArray.reduce(function(a, b) {
                    return a + b;
                }) / packetLossArray.length) : null;


            fakeSample = {
                date: computedDate,
                min: computedMin,
                avg: computedAvg,
                max: computedMax,
                minSet: minValues,
                avgSet: avgValues,
                maxSet: maxValues,
                original:{
                    min: computedOriginalMin,
                    avg: computedOriginalAvg,
                    max: computedOriginalMax
                },
                packetLoss: packetLoss
            };

            return fakeSample;
        };


        this._isXDomainChanged = function(xDomain){
            return Math.abs(lastDomainRedrawn[1].getTime() - xDomain[1].getTime()) >= (currentSeries.bucketLength / 2) * 1000;
        };


        this.getGraphicalSamples = function(xDomain){
            currentSeries = this._averageSeries(xDomain);
            return currentSeries.data;
        };


        //this._stableAverageSeries = function(xDomain){
        //    var computedSample, tmpSample, minValues, avgValues, maxValues, lastBucketStartDate, newSamples,
        //        allSamples, packetLoss, originalMin, originalAvg, originalMax, bucketKey, sampleTmp, sampleTime,
        //        biggestSample;
        //
        //
        //    if (!currentSeries || lastTimeWindow != env.timeWindowSize){
        //        lastDomainRedrawn = xDomain;
        //        lastTimeWindow = env.timeWindowSize;
        //        currentSeries = this._averageSeries(xDomain);
        //
        //    } else {
        //
        //        allSamples = this._getAllDataPointsMixed();
        //        if (allSamples.length == 0){
        //            return [];
        //        }
        //
        //        for (var n=0,length=allSamples.length; n<length; n++){
        //            sampleTmp = allSamples[n];
        //            if (!biggestSample || allSamples[n].date.getTime() > biggestSample.date.getTime()){
        //                biggestSample = allSamples[n]
        //            }
        //        }
        //
        //        sampleTime = parseInt(biggestSample.date.getTime() / 1000);
        //        bucketKey = parseInt(sampleTime - (sampleTime % currentSeries.bucketLength));
        //
        //        if (bucketKey > currentSeries.lastBucketKey) {
        //            console.log("ora");
        //            lastDomainRedrawn = xDomain;
        //            lastTimeWindow = env.timeWindowSize;
        //            currentSeries = this._averageSeries(xDomain);
        //
        //        } else {
        //            console.log("wrong");
        //            currentSeries.data.pop();
        //            lastBucketStartDate = currentSeries.lastBucketKey * 1000;
        //
        //            newSamples = [];
        //            for (var n=0,length=allSamples.length; n<length; n++){
        //                if (allSamples[n].date.getTime() >= lastBucketStartDate){
        //                    newSamples.push(allSamples[n]);
        //                }
        //            }
        //
        //            minValues = [];
        //            avgValues = [];
        //            maxValues = [];
        //
        //            originalMin = [];
        //            originalAvg = [];
        //            originalMax = [];
        //
        //            packetLoss = [];
        //
        //            for (var d = 0, length = newSamples.length; d < length; d++) { //for all the samples in the bucket
        //
        //                tmpSample = newSamples[d];
        //                if (tmpSample["min"] !== null) {
        //                    minValues.push(tmpSample["min"]);
        //                    //originalMin.push(tmpSample.original["min"]);
        //                }
        //                if (tmpSample["avg"] !== null) {
        //                    avgValues.push(tmpSample["avg"]);
        //                    //originalAvg.push(tmpSample.original["avg"]);
        //                }
        //                if (tmpSample["max"] !== null) {
        //                    maxValues.push(tmpSample["max"]);
        //                    //originalMax.push(tmpSample.original["max"]);
        //                }
        //
        //                packetLoss.push(tmpSample.packetLoss);
        //            }
        //
        //            computedSample = this._computeAvgSample(minValues, avgValues, maxValues, originalMin, originalAvg, originalMax, utils.timestampToUTCDate(lastBucketStartDate), packetLoss);
        //            if (computedSample.min !== null || computedSample.avg !== null || computedSample.max !== null || computedSample.packetLoss == 1) {
        //                currentSeries.data.push(computedSample);
        //            }
        //
        //        }
        //    }
        //
        //    return currentSeries.data;
        //};



        //this._stableAverageSeries = function(xDomain){
        //    var fakeSample, biggestSample, tmpSample, minValues, avgValues, maxValues, lastBucketStartDate, newSamples,
        //        previousBucket, packetLoss, originalMin, originalAvg, originalMax;
        //
        //    if (!currentSeries || currentSeries.data.length <= 3 || this._isXDomainChanged(xDomain) || !env.chartManager._isUpdatable()){
        //        lastDomainRedrawn = xDomain;
        //        lastTimeWindow = env.timeWindowSize;
        //        currentSeries = this._averageSeries(xDomain);
        //    } else {
        //
        //        previousBucket = currentSeries.data[currentSeries.data.length - 2];
        //        currentSeries.data.pop();
        //        lastBucketStartDate = previousBucket.date.getTime() + ((parseInt(currentSeries.bucketLength) / 2) * 1000);
        //        newSamples = this._getAllDataPointsMixed().filter(function(sample){
        //            biggestSample = (biggestSample && biggestSample > sample.date) ? biggestSample : sample.date;
        //            return sample.date.getTime() > lastBucketStartDate;
        //        });
        //
        //        minValues = [];
        //        avgValues = [];
        //        maxValues = [];
        //
        //        originalMin = [];
        //        originalAvg = [];
        //        originalMax = [];
        //
        //        packetLoss = [];
        //
        //        for (var d=0,length=newSamples.length; d<length; d++) { //for all the samples in the bucket
        //
        //            tmpSample = newSamples[d];
        //            if (tmpSample["min"] !== null){
        //                minValues.push(tmpSample["min"]);
        //                //originalMin.push(tmpSample.original["min"]);
        //            }
        //            if (tmpSample["avg"] !== null){
        //                avgValues.push(tmpSample["avg"]);
        //                //originalAvg.push(tmpSample.original["avg"]);
        //            }
        //            if (tmpSample["max"] !== null){
        //                maxValues.push(tmpSample["max"]);
        //                //originalMax.push(tmpSample.original["max"]);
        //            }
        //
        //            packetLoss.push(tmpSample.packetLoss);
        //        }
        //
        //        fakeSample = this._computeAvgSample(minValues, avgValues, maxValues, originalMin, originalAvg, originalMax, biggestSample, packetLoss);
        //        if (fakeSample.min !== null || fakeSample.avg !== null || fakeSample.max !== null) {
        //            currentSeries.data.push(fakeSample);
        //        }
        //    }
        //
        //    return currentSeries.data;
        //};


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


        this.getChartDom = function () {
            var probeDom, infoDom, groupDescription, dragIcon, deleteIcon;

            groupDescription = group.toString();
            probeDom = $('<div class="chart-item probe-multi-chart" id="chart-probe-' + group.id + '"></div>');
            infoDom = $('<div class="probe-multi-info"></div>')
                .height(chartHeight)
                .width(config.probeDescriptionDomWidth);

            dragIcon = $('<img src="' + env.widgetUrl +'view/img/drag_arrow.png" class="drag-icon"/>');
            deleteIcon = $('<img src="' + env.widgetUrl +'view/img/delete_chart_icon.png" class="delete-icon"/>');

            infoDom.append('<div class="probe-info-line first-line">' +  group.id + ' (' + group.probes.length + ' probes)' + '</div>');
            infoDom.append('<div class="probe-info-line" title="' + groupDescription + '">Probes: ' +  ((groupDescription.length >= 120) ? groupDescription.substring(0, 120) + "..." : groupDescription) + '</div>');
            infoDom.append('<div class="probe-info-line">Target: ' + env.measurements[this.group.measurementId].target + '</div>');
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
            return env.parentDom.find('.chart-item').last().attr('id').replace('chart-probe-', '') == this.group.id;
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


            this.updateLine(data, "min");
            this.updateLine(data, "avg");
            this.updateLine(data, "max");

            this.updateArea(data, "min");
            this.updateArea(data, "avg");
            this.updateArea(data, "max");

            this.drawPacketLoss(data);
            this.updateDots(data, "max");
            this.updateDots(data, "avg");
            this.updateDots(data, "min");

            timePointer
                .attr("y1", 0).attr("y2", height + margin.top);

            whiteLeftBackground
                .attr("height", height + margin.top)
        };


        this._computePacketLossSpots = function(data){
            var sample1, sample2, interval;
            $this.emptySpot = [];
            for (var n= 0,length=data.length; n<length - 1; n++){
                sample1 = data[n];
                sample2 = data[n + 1];

                interval = this.getGroupInterval();

                if (sample1.packetLoss == 1){
                    $this.emptySpot.push({pre: sample1.date, post: new Date(sample1.date.getTime() + (interval * 1000))});
                }

                if (sample2.packetLoss == 1){
                    $this.emptySpot.push({pre: new Date(sample2.date.getTime() - (interval * 1000)), post: sample2.date});
                }
            }
        };


        this.updateDots = function (data, key) {
            var dots, enteringDots;

            dots = svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date.getTime();
                });

            dots
                .exit()
                .remove();

            enteringDots = dots
                .enter()
                .append("circle")
                .filter(function(dataPoint){
                    return dataPoint[key] !== null;
                })
                .attr("cx", lineSkeletons[key].x())
                .attr("cy", lineSkeletons[key].y())
                .attr("r", 3);

            enteringDots
                .filter(function(dataPoint){
                    return dataPoint.date >= new Date(currentSeries.lastBucketKey * 1000);
                })
                .attr("r", 15)
                .transition()
                .duration(2000)
                .attr("r", 3);

            dots
                .attr("class", function(dataPoint){
                    if (!dataPoint.cut || !dataPoint.cut[key]){
                        return "dot fill-normal-dot " + key + " p" + $this.group.id;
                    } else {
                        return "dot fill-cut-dot " + key + " p" + $this.group.id;
                    }
                })
                .attr("cx", lineSkeletons[key].x())
                .attr("cy", lineSkeletons[key].y());

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


            this.drawPacketLoss(data);

            /*
             * Reverse order
             */
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


        this._addUndefinedPoints = function(data){
            var currentPoint, nextPoint, newDataSet, fakePoint, measurement, resolutionPeriod;

            newDataSet = [];
            resolutionPeriod = this.getGroupInterval();

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


        this.drawPacketLoss = function(data){
            var line, allLines, allAreas, filteredData, item;

            allAreas = svg
                .selectAll("rect.packet-loss-area")
                .data($this.emptySpot);

            allAreas
                .exit()
                .remove();

            allAreas
                .enter()
                .append("rect")
                .attr("class", "packet-loss-area")
                .attr("fill", "url(#pattern-pl-multiple)");

            allAreas
                .attr("x", function(dataSample) {
                    return x(dataSample.pre);
                })
                .attr("y", 0)
                .attr("width", function(dataSample) {
                    return x(dataSample.post) - x(dataSample.pre);
                })
                .attr("height", height + "px");



            line = lineSkeletons["min"];

            filteredData = [];
            for (var n=0,length=data.length; n<length; n++){
                item = data[n];
                if (item.packetLoss > config.notShownPacketLossThreshold){
                    filteredData.push(data[n]);
                }
            }

            allLines = svg
                .selectAll("line.packet-loss-line")
                .data(filteredData, function(dataPoint){
                    return dataPoint.date.getTime();
                });
                //.filter(function(dataSample){
                //    return dataSample.packetLoss > 0.1;
                //});

            allLines
                .exit()
                .remove();

            allLines
                .enter()
                .append("line")
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

            //computedYRange = (yRange) ? $.map(yRange, function(n){return (height/(yRange.length - 1)) * n}) : [height, 0];
            computedYRange = (yRange) ? yRange : [height, 0];

            x = d3.time.scale()
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

            if ($("#pattern-pl-multiple").length == 0){
                svg
                    .append("defs")
                    .append("pattern")
                    .attr("id", "pattern-pl-multiple")
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

            //computedYRange = (yRange) ? $.map(yRange, function(n){return (height/(yRange.length - 1)) * n}) : [height, 0];
            computedYRange = (yRange) ? yRange : [height, 0];

            console.log(yRange);
            x = d3.time.scale()
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

            if ($("#pattern-pl-multiple").length == 0){
                svg
                    .append("defs")
                    .append("pattern")
                    .attr("id", "pattern-pl-multiple")
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
                            .selectAll(".time-cursor")
                            .style("visibility", "visible")
                            .attr("x1", timePointerXPosition).attr("x2", timePointerXPosition);

                        $this.showPopUp(timePointerXPosition, dataSampleHovered);

                        d3
                            .selectAll(".p" + $this.group.id + ".dot[cx=\"" + xPosition + "\"]")
                            .attr("r", 7)
                            .transition()
                            .duration(2000)
                            .attr("r", 3);
                    }
                })
                .on("mouseout", function(event){
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

            return svg
                .selectAll(".dot." + key)
                .data(data, function(dataPoint){
                    return dataPoint.date.getTime();
                })
                .enter()
                .append("circle")
                .filter(function(dataPoint){
                    return dataPoint[key] !== null;
                })
                .attr("class", function(dataPoint){
                    if (!dataPoint.cut || !dataPoint.cut[key]){
                        return "dot fill-normal-dot " + key + " p" + $this.group.id;
                    } else {
                        return "dot fill-cut-dot " + key + " p" + $this.group.id;
                    }
                })
                .attr("cx", line.x())
                .attr("cy", line.y())
                .attr("r", function(d){
                    d.rendered = true;
                    return dotsRadius;
                })

        };


        this.drawLine = function (data, key, line) {
            return svg
                .append("path")
                .datum(data)
                .attr("class", "line " + key)
                .attr("d", line);
        };


        this.computeLine = function (data, key) {
            return d3.svg.line()
                .defined(function (dataPoint) {
                    return dataPoint[key] != null;
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
                if (dataPoint.original != null) {
                    if (dataPoint.original.max != null && dataPoint.max != null) {
                        rounding = (dataPoint.cut.max) ? ((dataPoint.max < dataPoint.cut.pmax)? ">" : "<") : false;
                        description.push('<span class="info-label max">Max: ' + dataPoint.original.max.toFixed(2) + 'ms (' + ((rounding) ? rounding : "") + dataPoint.max.toFixed(2) + '%)</span>');
                    }
                    if (dataPoint.original.avg != null && dataPoint.avg != null) {
                        rounding = (dataPoint.cut.avg) ? ((dataPoint.avg < dataPoint.cut.pavg)? ">" : "<") : false;
                        description.push('<span class="info-label avg">Med: ' + dataPoint.original.avg.toFixed(2) + 'ms (' + ((rounding) ? rounding : "") + dataPoint.avg.toFixed(2) + '%)</span>');
                    }
                    if (dataPoint.original.min != null && dataPoint.min != null) {
                        rounding = (dataPoint.cut.min) ? ((dataPoint.min < dataPoint.cut.pmin)? ">" : "<") : false;
                        description.push('<span class="info-label min">Min: ' + dataPoint.original.min.toFixed(2) + 'ms (' + ((rounding) ? rounding : "") + dataPoint.min.toFixed(2) + '%)</span>');
                    }
                }
                if (dataPoint.packetLoss != null) {
                    description.push("PacketLoss: " + (dataPoint.packetLoss.toFixed(2) * 100) + "%");
                }
                //description.push("" + dataPoint.sent + " packet sent, "+ dataPoint.received + " received");


                popUpDiv.html(description.join("<br>"));
            }, config.hoverPopUpDelay);

        };


        this.hidePopUp = function(){
            popUpDiv.hide();
            clearTimeout(popUpTimer);
        };

    };

    return ChartMultiProbeView;
});