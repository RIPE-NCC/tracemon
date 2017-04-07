define([
    "tracemon.env.utils"
], function(utils){

    var EdgeView = function(env, fromNodeView, toNodeView) {
        this.id = utils.getIdFromIp(fromNodeView.model.getId()) + "-" + utils.getIdFromIp(toNodeView.model.getId());
        this.from = fromNodeView;
        this.to = toNodeView;
        this.type = "edgeView";

        this._paths = [];
        this._pathsMap = {};
        this._hovered = false;
        this._selected = false;
    };


    EdgeView.prototype = {

        addPathView: function(pathView) {
            if (!this._pathsMap[pathView.id]){
                this._pathsMap[pathView.id] = true;
                this._paths.push(pathView);
                pathView.addEdge(this);
            }
        },

        getStateKey: function(){
            var status = [];

            status.push(this.id);
            status.push(this.isDisconnected());

            return status.join();
        },

        getPoints: function(){
            var points, edge, edgePoints, fromId, toId;

            points = [];
            fromId = this.from.model.getId();
            toId = this.to.model.getId();
            edge = env.mainView.graph.getEdge(fromId, toId);
            edgePoints = (edge) ? edge.points : [];
            points.push(env.mainView.graph.getNode(fromId));
            points = points.concat(edgePoints);
            points.push(env.mainView.graph.getNode(toId));

            return points;
        },

        isDisconnected: function(disconnected){
            if (disconnected === undefined){
                return this._disconnected && !this.isFocusOut();
            } else if (!this.isFocusOut()){
                this._disconnected = disconnected;
            }
        },

        isSelected: function(selected){
            if (selected === undefined){
                return this._selected && !this.isFocusOut();
            } else if (!this.isFocusOut()){
                this._selected = selected;
            }
        },

        isHovered: function(hovered){

            if (hovered === undefined){
                return this._hovered && !this.isFocusOut();
            } else if (!this.isFocusOut()) {
                var pathViews;

                this._hovered = hovered;
                pathViews = this.getPathViews();
                for (var n = 0, length = pathViews.length; n < length; n++) {
                    pathViews[n].isSelected(hovered);
                }
            }
        },

        getPathViews: function () {
            return this._paths;
        },

        getClass: function(selector){
            var classes;

            classes = ["edge", "edge-" + this.id];

            if (this.isDisconnected()){
                classes.push("disconnected");
            }

            return (selector) ? "." + classes.join(".") : classes.join(" ");
        },

        isFocusOut: function () {
            if (env.currentSearchResults) {
                return this.from.isFocusOut() || this.to.isFocusOut();
            }

            return false;
        },

        equalsTo: function(pathView){
            return this.id == pathView.id
                && JSON.stringify(this.points) == JSON.stringify(pathView.points)
                && this.isFocusOut() == pathView.isFocusOut()
                && this.isHovered() == pathView.isHovered();
        }

    };



    return EdgeView;
});