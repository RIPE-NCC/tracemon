
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
        firstDraw = true;
        env.mainView = this;
        this.view = null;
        this.viewName = env.viewName;

        this.graph = new GraphWrapper(env);

        this.graph.initGraph(1400, 1400, {
            margin: { top: 100, bottom: 100, left: 150, right: 150 }
        });

        this.setListeners = function(){
            utils.observer.subscribe("update-status", this.drawOrUpdate, this);
            utils.observer.subscribe("new-measurement", this.newMeasurement, this);
            utils.observer.subscribe("cut-hops-length", this._cutHops, this);
            // utils.observer.subscribe("model-change", this.drawOrUpdate, this);
        };

        this.emulateHistory = function(){

        };

        this.newMeasurement = function(){
            env.historyManager.getLastState();
        };


        this.drawOrUpdate = function(status){
            console.log("Drawing");

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
            var diff;

            this._initChart();
            diff = this._computeDiff(this._oldStatus, newStatus);
            this._oldStatus = newStatus;

            this.view = this._getView();

            this.view.draw(diff, function(){
                console.log("drawn");
            }); // Compute the layout and draw
        };


        this._initChart = function(){
            this.svg = d3.select("svg");

            this.pathsContainer = this.svg
                .append("g")
                .attr("class", "edges");

            this.nodesContainer = this.svg
                .append("g")
                .attr("class", "nodes");

        };

        //
        // this._updateProxy = function (){
        //
        //
        //     setTimeout();
        // };

        this._update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);
            // this._updateScene(diff);
            this.view.update(diff, function(){
                console.log("updated");
            });
            // this._oldStatus = newStatus;
        };

        // this._updateScene = function (diff) {
        //
        //     for (var t=0,length = diff.newTraceroutes.length; t<length; t++) {
        //         this.addTraceroute(diff.newTraceroutes[t]);
        //     }
        //
        // };


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
                        if (newStatus[msmId][source].getHash() != oldStatus[msmId][source].getHash()) {
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