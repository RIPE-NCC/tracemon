/**
 * Created with JetBrains WebStorm.
 * User: mcandela
 * Date: 10/2/13
 * Time: 10:42 AM
 * To change this template use File | Settings | File Templates.
 */

define([
    "latencymon.lib.d3-amd"
], function(d3){

    /**
     * TimeOverviewView is the view component providing the time overview bar.
     * It allows the user to easily interact with the TimeController.
     *
     * @class TimeOverviewView
     * @constructor
     * @module view
     */

    var TimeOverviewView = function(options, callbacks){
        var timeMapper, timeTicker, brusherBucketLevelsMinutes, timeGrid, margins, width, hideIfLessThanSeconds,
            height, brush, xAxis, svg, groupOverview, timeUnitGrid, $this, dom, labels, verticalLabels,
            format, innerWidth, innerHeight, endCallback, interactionCallback, changeCallback, initCallback,
            parent, borderMargin;

        $this = this;
        margins = options.margins;
        brusherBucketLevelsMinutes = options.granularityLevels;
        hideIfLessThanSeconds = options.hideIfLessThanSeconds;
        verticalLabels = (options.verticalLabels != null) ? options.verticalLabels : true;
        format = options.format || d3.time.format.utc("%Y-%m-%d");
        endCallback = callbacks.end;
        interactionCallback = callbacks.interaction;
        changeCallback = callbacks.change;
        initCallback = callbacks.init;
        width = options.width;
        height = options.height;

        borderMargin = 1;


        /**
         * This method initialises the time overview
         *
         * @method init
         * @input {Object} domElement A DOM element to be filled with the time overview representation
         * @input {Array} domainRange An array composed of two Date object and describing the actual domain
         * @input {Array} currentSelection An array composed of two Date object and describing the actual selection
         */

        this.init = function(domElement, domainRange, currentSelection){
            var points;

            parent = d3.select(domElement);
            dom = parent
                .append('div')
                .attr('class', 'time-overview-container');

            if (domainRange && currentSelection){
                this.render(domainRange, currentSelection);
                points = [xAxis(currentSelection[0]), xAxis(currentSelection[1])];
                initCallback.call(this, currentSelection[0], currentSelection[1], points);
            }
        };


        /**
         * This is a callback triggered after the interaction with the time overview
         *
         * @method _afterInteraction
         * @private
         */

        this._afterInteraction = function(){
            if (!d3.event.sourceEvent) return;
            var extent0, selectionPoints, boundedLeft, boundedRight, selectionPointsRounded, magneticEffect, points;

            extent0 = brush.extent();

            boundedLeft = false;
            boundedRight = false;
            magneticEffect = 10 * 60 * 60 * 1000;

            selectionPoints = extent0; // Normal selection
            selectionPointsRounded = extent0.map(timeUnitGrid.round); // Magnetic effect

            // If empty or reversed align it to the minimum unit possible
            if (selectionPointsRounded[0] >= selectionPointsRounded[1]) {
                selectionPointsRounded[0] = timeUnitGrid.floor(extent0[0]);
                selectionPointsRounded[1] = timeUnitGrid.ceil(extent0[1]);
            }

            if (selectionPoints[0].getTime() <= $this.domainRange[0].getTime() + magneticEffect){
                selectionPoints[0] = $this.domainRange[0];
                boundedLeft = true;
            }

            if (selectionPoints[1].getTime()  >= $this.domainRange[1].getTime() - magneticEffect){
                selectionPoints[1] = $this.domainRange[1];
                boundedRight = true;
            }

            if (boundedLeft && !boundedRight){
                selectionPoints[1] = selectionPointsRounded[1];
            }else if (!boundedLeft && boundedRight){
                selectionPoints[0] = selectionPointsRounded[0];
            }else if (!boundedLeft && !boundedRight){
                selectionPoints[0] = selectionPointsRounded[0];
                selectionPoints[1] = selectionPointsRounded[1];
            }

            // Apply magnetic feedback
            d3.select(this).transition()
                .call(brush.extent(selectionPoints));

            points = [xAxis(selectionPoints[0]), xAxis(selectionPoints[1])];

            endCallback.call(this, selectionPoints[0], selectionPoints[1], points);
        };


        /**
         * This is a callback triggered during the interaction with the time overview
         *
         * @method _duringInteraction
         * @private
         */

        this._duringInteraction = function(){
            if (!d3.event.sourceEvent) return;
            var extent0, selectionPoints, points;

            extent0 = brush.extent();

            selectionPoints = extent0;

            points = [xAxis(selectionPoints[0]), xAxis(selectionPoints[1])];
            interactionCallback.call(this, selectionPoints[0], selectionPoints[1], points);
        };


        /**
         * This method renders the time overview
         *
         * @method render
         * @input {Array} domainRange An array composed of two Date object and describing the actual domain
         * @input {Array} currentSelection An array composed of two Date object and describing the actual selection
         */

        this.render = function(domainRange, currentSelection){
            var timeWindow;

            this.domainRange = domainRange;
            this.currentSelection = currentSelection;

            timeWindow = domainRange[1] - domainRange[0];

            if (timeWindow < hideIfLessThanSeconds * 1000){
                return false;
            }

            if (timeWindow < (brusherBucketLevelsMinutes.day * 60 * 1000)){
                timeMapper = d3.time.day.utc;
                timeTicker = d3.time.days.utc;
                timeGrid = d3.time.hours.utc;
                timeUnitGrid = d3.time.hour.utc;
            }else if (timeWindow < (brusherBucketLevelsMinutes.week * 60 * 1000)){
                timeMapper = d3.time.week.utc;
                timeTicker = d3.time.weeks.utc;
                timeGrid = d3.time.days.utc;
                timeUnitGrid = d3.time.day.utc;
            }else if (timeWindow < (brusherBucketLevelsMinutes.month * 60 * 1000)){
                timeMapper = d3.time.month.utc;
                timeTicker = d3.time.months.utc;
                timeGrid = d3.time.weeks.utc;
                timeUnitGrid = d3.time.week.utc;
            }else{
                timeMapper = d3.time.year.utc;
                timeTicker = d3.time.years.utc;
                timeGrid = d3.time.months.utc;
                timeUnitGrid = d3.time.month.utc;
            }

            innerWidth = width - margins.left - margins.right - borderMargin;
            innerHeight = height - margins.top - margins.bottom;

            xAxis = d3
                .time
                .scale
                .utc()
                .domain(domainRange)
                .range([0, innerWidth]);

            brush = d3.svg.brush()
                .x(xAxis)
                .extent(currentSelection)
                .on("brush", $this._duringInteraction)
                .on("brushend", $this._afterInteraction);

            svg = dom
                .append("svg")
                .attr("class", "time-overview")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

            svg.append("rect")
                .attr("class", "grid-background")
                .attr("width", innerWidth)
                .attr("height", innerHeight);

            svg.append("g")
                .attr("class", "x grid")
                .attr("transform", "translate(0," + innerHeight + ")")
                .call(d3.svg.axis()
                    .scale(xAxis)
                    .orient("bottom")
                    .ticks(timeGrid)
                    .tickSize(-innerHeight)
                    .tickFormat(""))
                .selectAll(".tick")
                .classed("minor", function(d) { return d.getHours(); });

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + innerHeight + ")")
                .call(d3.svg.axis()
                    .scale(xAxis)
                    .orient("bottom")
                    .ticks(timeTicker)
                    .tickFormat(format)
                    .tickPadding(0))
                .selectAll("text")
                .attr("x", 6)
                .style("text-anchor", null);

            groupOverview = svg.append("g")
                .attr("class", "brush")
                .call(brush);

            groupOverview.selectAll("rect")
                .attr("height", innerHeight);

            labels = svg.selectAll("text")
                .style("text-anchor", "end");

            if (verticalLabels){
                labels
                    .attr("dx", "-1.2em")
                    .attr("dy", ".15em")
                    .attr('transform', 'rotate(-65)');
            }

            return true;
        };


        /**
         * This method updates the time overview. If the domainRange changes, a complete redraw is triggered.
         *
         * @method update
         * @input {Array} domainRange An array composed of two Date object and describing the actual domain
         * @input {Array} currentSelection An array composed of two Date object and describing the actual selection
         */

        this.update = function(domainRange, currentSelection){
            var points, out;

            if (this.domainRange[0] == domainRange[0] && this.domainRange[1] == domainRange[1]){
                return this.updateSelection(currentSelection);
            }else{
                dom
                    .select(".time-overview")
                    .remove();

                out = this.render(domainRange, currentSelection);
                points = [xAxis(currentSelection[0]), xAxis(currentSelection[1])];
                changeCallback.call(this, currentSelection[0], currentSelection[1], points);

                return out;
            }
        };



        /**
         * This method redraws the time overview imposing a different width
         *
         * @method width
         * @input {Number} newWidth The new width in pixels
         */

        this.width = function(newWidth){
            if (newWidth == null){
                return width;
            }else{
                if (width != newWidth && this.domainRange && this.currentSelection){

                    width = newWidth;
                    dom
                        .select(".time-overview")
                        .remove();

                    this.render(this.domainRange, this.currentSelection);
                }
            }
        };


        /**
         * This method updates the selection on the time overview
         *
         * @method updateSelection
         * @input {Array} currentSelection An array composed of two Date object and describing the actual selection
         */

        this.updateSelection = function(currentSelection){
            var points;

            if (this.currentSelection != currentSelection){
                groupOverview
                    .call(brush.extent(currentSelection));

                points = [xAxis(currentSelection[0]), xAxis(currentSelection[1])];
                changeCallback.call(this, currentSelection[0], currentSelection[1], points);

                return true;
            }
            return false;
        };
};

return TimeOverviewView;
});