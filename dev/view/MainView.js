
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.view.single-host.single-host-view",
    "tracemon.view.as-view",
    "tracemon.view.location-view",
    // "tracemon.view.dagre-wrapper",
    "tracemon.view.graphviz-wrapper",
    "tracemon.env.latencymon-adapter"
], function(utils, config, lang, $, d3, SingleHostView, ASView, LocationView, GraphWrapper, LatencyMonAdapter){

    var MainView = function(env){
        var $this, firstDraw;

        $this = this;
        this.hosts = {};
        this._oldStatus = {};
        this._drawnStatus = null;
        firstDraw = true;
        this.view = null;
        this.viewName = env.viewName;
        this.latencymon = new LatencyMonAdapter(env);
        this.graph = new GraphWrapper(env);

        this.setListeners = function(){
            utils.observer.subscribe("view.status:change", this.drawOrUpdate, this);
            utils.observer.subscribe("view:max-hops", this._cutHops, this);
        };

        this.getDrawnTraceroutes = function(){
            var measurement, traceroutes;

            traceroutes = [];
            for (var msm in this._drawnStatus){
                measurement = this._drawnStatus[msm];
                for (var source in measurement){
                    traceroutes.push(measurement[source]);
                }
            }

            return traceroutes;
        };

        this._filterBySources = function(status){
            var newStatus;

            if (env.finalQueryParams.sources.length == 0){
                return status;
            } else {
                newStatus = {};
                for (var msm in status) {
                    newStatus[msm] = {};
                    for (var source in status[msm]) {
                        if (env.finalQueryParams.sources.indexOf(parseInt(source)) != -1) {
                            newStatus[msm][source] = status[msm][source];
                        }
                    }
                }
                return newStatus;
            }
        };

        this.drawOrUpdate = function(status){

            this._drawnStatus = this._filterBySources(status);

            if (firstDraw){
                this._firstDraw(this._drawnStatus);
            } else { 
                this._update(this._drawnStatus);
            }

        };


        this._cutHops = function(hops) {
            console.log("view:max-hops");
        };


        this._getView = function(){
            switch(this.viewName) {
                case "host":
                    return new SingleHostView(env);
                    break;
                case "as":
                    return new ASView(env);
                    break;
                case "geo":
                    return new LocationView(env);
                    break;
                default:
                    throw "Select a view"
            }
        };

        this._firstDraw = function(newStatus){
            var diff, maxLengthTraceroute;

            diff = this._computeDiff(this._oldStatus, newStatus);

            if (diff.status.length > 0) { // Something to draw
                maxLengthTraceroute = Math.max.apply(null, $.map(diff.newTraceroutes, function (item) {
                    return item.getLength();
                }));

                this._initChart(maxLengthTraceroute);

                this.view = this._getView();

                utils.observer.publish("view.ready");
                this.view.draw(diff, function () { // Compute the layout and draw
                    console.log("drawn");
                    utils.observer.publish("view.graph:new");
                });

                firstDraw = false;
                this.latencymon.init(".latencymon-chart", env.queryParams.measurements, env.finalQueryParams.sources); // Init LatencyMON
            } else {
                utils.observer.publish("error", {
                    type: "324",
                    message: config.errors["324"]
                });
            }
            this._oldStatus = newStatus;
        };

        this._update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);

            console.log(diff);
            if (diff.status.length > 0) { // Something to update
                this.view.update(diff, function () {
                    utils.observer.publish("view.graph:change");
                });
            }
            this._oldStatus = newStatus;
        };


        this._initChart = function(maxLengthTraceroute){
            var svgHeight;

            this.svg = d3
                .select(env.template.dom.svg[0]);

            this.pathsContainer = this.svg
                .append("g")
                .attr("class", "edges");

            this.edgesContainer = this.svg
                .append("g")
                .attr("class", "edges");

            this.nodesContainer = this.svg
                .append("g")
                .attr("class", "nodes");

            this.warningsContainer = this.svg
                .append("g")
                .attr("class", "warnings");

            svgHeight = Math.max(this.svg.style("height").replace("px", ""), maxLengthTraceroute * config.graph.verticalNodeDistance);
            this.svg.style("height", svgHeight + "px");

            this.graph.initGraph(
                parseInt(this.svg.style("width").replace("px", "")),
                parseInt(svgHeight),
                {
                    margin: config.graph.margins
                }
            );



        };


        this._computeDiff = function(oldStatus, newStatus) {
            var out;

            out = {
                status: this._getStatus(newStatus),
                newTraceroutes: this._getNewTraceroutes(oldStatus, newStatus),
                updatedTraceroutes: this._getUpdatedTraceroutes(oldStatus, newStatus),
                deletedTraceroutes: this._getDeletedTraceroutes(oldStatus, newStatus)
            };

            return out;
        };

        this._getNewTraceroutes = function (oldStatus, newStatus){
            var newTraceroutes;

            newTraceroutes = [];

            for (var msmId in newStatus) {

                if (!oldStatus[msmId]) { // It is a new measurement, everything is new in it
                    for (var source in newStatus[msmId]) {
                        newTraceroutes.push(newStatus[msmId][source]);
                    }
                }
            }

            return newTraceroutes;
        };

        this._getStatus = function (newStatus){
            var status;

            status = [];

            for (var msmId in newStatus) {
                for (var source in newStatus[msmId]) {
                    status.push(newStatus[msmId][source]);
                }
            }

            return status;
        };


        this._getUpdatedTraceroutes = function (oldStatus, newStatus){
            var updatedTraceroute;

            updatedTraceroute = [];
            for (var msmId in newStatus) {
                if (oldStatus[msmId]) { // It is an old measurement
                    for (var source in newStatus[msmId]) {
                        // updatedTraceroute.push({ now: newStatus[msmId][source], before: oldStatus[msmId][source] });

                        if (newStatus[msmId][source] && oldStatus[msmId][source] && newStatus[msmId][source].getBestPathHash() != oldStatus[msmId][source].getBestPathHash()) {
                            updatedTraceroute.push({ now: newStatus[msmId][source], before: oldStatus[msmId][source] });
                        } else {
                            // if (newStatus[msmId][source].getHash() != oldStatus[msmId][source].getHash()){
                            //
                            // }
                        }
                    }
                }
            }

            return updatedTraceroute;
        };


        this._computeValidId = function(str){
            return utils.getIdFromIp(str).replace("*", "w-");
        };

        this._getDeletedTraceroutes = function (oldStatus, newStatus){
            var deletedTraceroutes;

            deletedTraceroutes = [];

            for (var msmId in oldStatus) {

                if (!newStatus[msmId]) { // The entire measurement has been deleted
                    for (var source in oldStatus[msmId]) {
                        deletedTraceroutes.push(oldStatus[msmId][source]);
                    }
                } else {
                    for (var source in oldStatus[msmId]) {
                        if (!newStatus[msmId][source]) {
                            deletedTraceroutes.push(oldStatus[msmId][source]);
                        }
                    }
                }
            }

            return deletedTraceroutes;
        };


        this.getSvg = function(){
            var svgXml;

            svgXml = utils.getSvgAndCss(env.template.dom.svg[0]);
            // var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgXml);
            //
            // window.open(url);
            return svgXml;
        };

        this.setLabelLevel = function(level){
            env.labelLevel = level;
            utils.observer.publish("view.label-level:change", level);
        };

        this.setListeners();

    };


    return MainView;
});