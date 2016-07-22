
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.view.single-host-view",
    "tracemon.view.as-view"
], function(utils, config, lang, $, d3, SingleHostView, ASView){

    var MainView = function(env){
        var $this;

        $this = this;
        this.hosts = {};
        this._oldStatus = {};

        env.mainView = this;

        this.singleHostView = null;
        this.view = null;
        this.viewName = env.viewName;


        this.graph = new dagreD3
            .graphlib
            .Graph({ multigraph: true })
            .setGraph({ "rankDir": "LR", "nodesep": 30, "ranksep": 50, "edgesep": 5 })
            .setDefaultEdgeLabel(function() { return {}; });

        this.setListeners = function(){
            utils.observer.subscribe("update-status", this._update, this);
            utils.observer.subscribe("init-status", this._firstDraw, this);
            utils.observer.subscribe("ixp-detected", this._updateIxp, this);
            utils.observer.subscribe("cut-hops-length", this._cutHops, this);
        };

        this._cutHops = function(hops){
            console.log("cut-hops-length");
        };

        this._updateIxp = function(host){
            $($this.svg[0])
                .find(".type-" + utils.getIdFromIp(host.getId()) + " tspan")
                .text("IXP: " + host.getId());
            console.log("IXP: " + host.ip);
        };



        this._getView = function(){
            switch(this.viewName) {
                case "host":
                    return new SingleHostView(env);
                    break;
                case "as":
                    return new ASView(env);
                    break;
                default:
                    throw "Select a view"
            }
        };


        this._firstDraw = function(newStatus){
            var diff, render, svg, svgGroup, xCenterOffset;

            diff = this._computeDiff(this._oldStatus, newStatus);
            this._oldStatus = newStatus;

            this.view = this._getView();
            this.view.draw(diff.newTraceroutes); // Compute the layout

            // Draw the chart for real
            render = new dagreD3.render();
            this.svg = d3.select("svg");
            svgGroup = this.svg.append("g");
            render(d3.select("svg g"), this.graph);
            this.svg.attr("width", this.graph.graph().width);
            this.svg.attr("height", this.graph.graph().height);
            xCenterOffset = 0;
            svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
            this.svg.attr("height", this.graph.graph().height + 40);


        };

        this._update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);
            console.log(diff);
            this._updateScene(diff);
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