
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
            // utils.observer.subscribe("update-status", this._update, this);
            utils.observer.subscribe("new-measurement", this.drawOrUpdate, this);
            utils.observer.subscribe("cut-hops-length", this._cutHops, this);
            // utils.observer.subscribe("model-change", this.drawOrUpdate, this);
        };




        this.drawOrUpdate = function(){
            console.log("Drawing");
            var status, netGraph, traceroutesList;

            traceroutesList = $.map(env.main.loadedMeasurements, function(item){
                return item.getTraceroutes();
            });
            status = env.main.getLastState();
            if (firstDraw){
                this._firstDraw(status);
                firstDraw = false;
            } else {
                this._update(status);
            }
        };

        this._computeInitialPositions = function(){
            var status, netGraph, traceroutesList;

            traceroutesList = $.map(env.main.loadedMeasurements, function(item){
                return item.getTraceroutes();
            });
            netGraph = this.computeNet(traceroutesList);
        };

        this._partialUpdate = function(whatChanged){
            env.main.getLastState();
            this._updateProxy();
        };

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


        this._drawChart = function(){
            var svg, svgGroup, xCenterOffset;
            // Draw the chart for real
            $this._render = new dagreD3.render();
            $this.svg = d3.select("svg");
            svgGroup = $this.svg.append("g");
            $this._render(d3.select("svg g"), $this.graph);
            $this.svg.attr("width", $this.graph.graph().width);
            $this.svg.attr("height", $this.graph.graph().height);
            xCenterOffset = 0;
            svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
            $this.svg.attr("height", $this.graph.graph().height + 40);

        };


        this._firstDraw = function(newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);
            this._oldStatus = newStatus;

            console.log(diff.newTraceroutes);
            this.view = this._getView();
            this.view.draw(diff.newTraceroutes, this._drawChart); // Compute the layout and draw
        };

        this._updateProxy = function (){


            setTimeout();
        };

        this._update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);
            this._updateScene(diff);
            this.view.draw(diff.updatedTraceroutes, function(){
                console.log("drawn");
                $this._render($this.svg, $this.graph);
                // new dagreD3.render();
            }); // Compute the layout and draw
            this._oldStatus = newStatus;
        };

        this._updateScene = function (diff) {

            for (var t=0,length = diff.newTraceroutes.length; t<length; t++) {
                this.addTraceroute(diff.newTraceroutes[t]);
            }

        };


        this._computeDiff = function(oldStatus, newStatus) {
            var out;

            out = {
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


        this._getUpdatedTraceroutes = function (oldStatus, newStatus){
            var updatedTraceroute;

            updatedTraceroute = [];
            for (var msmId in newStatus) {
                if (oldStatus[msmId]) { // It is an old measurement
                    for (var source in newStatus[msmId]) {
                        if (newStatus[msmId][source].getHash() != oldStatus[msmId][source].getHash()) {
                            updatedTraceroute.push(newStatus[msmId][source]);
                        }
                    }
                }
            }

            return updatedTraceroute;
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


        this.setListeners();

    };


    return MainView;
});