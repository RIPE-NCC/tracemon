
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.view.single-host-view",
    "tracemon.view.as-view",
    "tracemon.view.location-view",
    "tracemon.view.dagre-wrapper"
], function(utils, config, lang, $, d3, SingleHostView, ASView, LocationView, GraphWrapper){

    var MainView = function(env){
        var $this, firstDraw;

        $this = this;
        this.hosts = {};
        this._oldStatus = {};
        this.shownSources = {};
        firstDraw = true;
        this.view = null;
        this.viewName = env.viewName;

        this.graph = new GraphWrapper(env);

        this.setListeners = function(){
            utils.observer.subscribe("update-status", this.drawOrUpdate, this);
            utils.observer.subscribe("new-measurement", this.newMeasurement, this);
            utils.observer.subscribe("cut-hops-length", this._cutHops, this);
            utils.observer.subscribe("probe-set-changed", this._updateShownSources, this);
            // utils.observer.subscribe("model-change", this.drawOrUpdate, this);
        };

        this.emulateHistory = function(){

        };

        this.newMeasurement = function(){
            env.historyManager.getLastState();
        };


        this._updateShownSources = function(newSet){
            this.shownSources = {};
            for (var n=0,length=newSet.length; n<length; n++) {
                this.shownSources[newSet[n]] = true;
            }
            env.historyManager.getLastState();
        };


        this._filterBySources = function(status){
            var newStatus;

            if (Object.keys(this.shownSources).length == 0){
                return status;
            } else {
                newStatus = {};
                for (var msm in status) {
                    newStatus[msm] = {};
                    for (var source in status[msm]) {
                        if (this.shownSources[source]) {
                            newStatus[msm][source] = status[msm][source];
                        }
                    }
                }
                return newStatus;
            }
        };

        this.drawOrUpdate = function(status){
            console.log("Drawing");

            status = this._filterBySources(status);
            if (firstDraw){
                this._firstDraw(status);
                firstDraw = false;
            } else {
                this._update(status);
            }
        };

        // this._partialUpdate = function(whatChanged){
        //     env.main.getLastState();
        //     this._updateProxy();
        // };

        this._cutHops = function(hops){
            console.log("cut-hops-length");
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
                    margin: { top: 100, bottom: 100, left: 150, right: 150 }
                }
            );



        };


        this._update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);
            this.view.update(diff, function(){
                console.log("updated");
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


        // this._getDiff = function(before, now){
        //     var hopsBefore, hopsAfter;
        //
        //     hopsBefore = before.getHops();
        //     hopsAfter = now.getHops();
        //
        //     for (var n=0; n<length; n++) {
        //
        //     }
        // };



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


        this._getPathString = function(){

        };

        this.setListeners();

    };


    return MainView;
});