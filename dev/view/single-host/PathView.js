define([
    "tracemon.env.utils"
], function(utils){

    var PathView = function(env, model) {
        this.id = utils.getIdFromIp(model.stateKey);
        this.model = model;
        this._edges = [];
        this._edgesMap = {};
        this.type = "pathView";
        this._hovered = false;
        this._selected = false;
    };


    PathView.prototype = {
        
        getPoints: function(){
            var points, unifiedPathArray;

            unifiedPathArray = this.getEdges();
            points = [];

            for (var n=0,length=unifiedPathArray.length; n<length; n++){
                points = points.concat(unifiedPathArray[n].getPoints());
            }

            return points;
        },

        addEdge: function(edgeView){
            if (!this._edgesMap[edgeView.id]){
                this._edges.push(edgeView);
                this._edgesMap[edgeView.id] = true;
            }
        },

        getEdges: function () {
            return this._edges.filter(function(edge){return !edge.isDisconnected();});
        },

        isSelected: function(selected){
            if (selected === undefined){
                return this._selected && !this.isFocusOut();
            } else if (!this.isFocusOut()){
                var nodeViews, nodeView;

                this._selected = selected;
                nodeViews = this.getNodeViews();
                for (var n = 0, length = nodeViews.length; n < length; n++) {
                    nodeView = nodeViews[n];
                    if (nodeView) {
                        nodeView.isSelected(selected);
                    }
                }
            }
        },

        isHovered: function(hovered){

            if (hovered === undefined){
                return this._hovered && !this.isFocusOut();
            } else if (!this.isFocusOut()) {
                var nodeViews, nodeView;

                this._hovered = hovered;
                nodeViews = this.getNodeViews();
                for (var n = 0, length = nodeViews.length; n < length; n++) {
                    nodeView = nodeViews[n];
                    if (nodeView) {
                        nodeView.isSelected(hovered);
                    }
                }
            }
        },

        getNodeViews: function(){
            if (!this._nodeViewsList){
                var hosts = this.model.getHostList();
                this._nodeViewsList = [];
                for (var n=0,length=hosts.length; n<length; n++){
                    this._nodeViewsList.push(env.mainView.view.nodes[hosts[n].getId()]);
                }
            }

            return this._nodeViewsList;
        },

        getClass: function(selector){
            var classes;

            classes = ["path", "path-" + this.id];

            return (selector) ? classes.join(".") : classes.join(" ");
        },

        isFocusOut: function () {
            if (env.currentSearchResults) {
                return !env.currentSearchResults.in[this.model.id];
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



    return PathView;
});