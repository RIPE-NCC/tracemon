
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.view.single-host-view",
    "tracemon.view.as-view",
    "tracemon.view.location-view",
    "tracemon.view.dagre-wrapper",
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
            utils.observer.subscribe("view.traceroute.search:change", this._applySearch, this);
        };


        this._applySearch = function (searchResults) {
            this.view.applySearch(searchResults);
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

        // this._updateShownSources = function(newSet){
        //     shownSources = {};
        //     for (var n=0,length=newSet.length; n<length; n++) {
        //         shownSources[newSet[n]] = true;
        //     }
        //     env.historyManager.getLastState();
        // };

        this._filterBySources = function(status){
            var newStatus;

            if (env.main.shownSources.length == 0){
                return status;
            } else {
                newStatus = {};
                for (var msm in status) {
                    newStatus[msm] = {};
                    for (var source in status[msm]) {
                        if (env.main.shownSources.indexOf(parseInt(source)) != -1) {
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
                firstDraw = false;
                this.latencymon.init(".latencymon-chart", env.queryParams.measurements, env.main.shownSources); // Init LatencyMON
            } else {
                this._update(this._drawnStatus);
            }

        };


        this._cutHops = function(hops){
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
            maxLengthTraceroute = Math.max.apply(null, $.map(diff.newTraceroutes, function(item){
                return item.getLength();
            }));

            this._initChart(maxLengthTraceroute);

            this._oldStatus = newStatus;

            this.view = this._getView();

            this.view.draw(diff, function(){
                console.log("drawn");
            }); // Compute the layout and draw
        };


        this._initChart = function(maxLengthTraceroute){
            var svgHeight;

            this.svg = d3
                .select(env.template.dom.svg[0]);

            this.pathsContainer = this.svg
                .append("g")
                .attr("class", "edges");

            this.nodesContainer = this.svg
                .append("g")
                .attr("class", "nodes");

            svgHeight = Math.max(this.svg.style("height").replace("px", ""), maxLengthTraceroute * config.graph.verticalNodeDistance);
            this.svg.style("height", svgHeight);

            this.graph.initGraph(
                parseInt(this.svg.style("width").replace("px", "")),
                parseInt(svgHeight),
                {
                    margin: { top: 100, bottom: 20, left: 150, right: 150 }
                }
            );



        };


        this._update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);
            this.view.update(diff, function(){
            });
            this._oldStatus = newStatus;
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
                        if (newStatus[msmId][source] && oldStatus[msmId][source] && newStatus[msmId][source].getHash() != oldStatus[msmId][source].getHash()) {
                            updatedTraceroute.push({ now: newStatus[msmId][source], before: oldStatus[msmId][source] });
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

                if (!newStatus[msmId]) { // it has been deleted
                    for (var source in oldStatus[msmId]) {
                        deletedTraceroutes.push(oldStatus[msmId][source]);
                    }
                }
            }

            return deletedTraceroutes;
        };


        this.setLabelLevel = function(level){
            env.labelLevel = level;
            utils.observer.publish("view.label-level:change", level);
        };

        this.setListeners();

    };


    return MainView;
});