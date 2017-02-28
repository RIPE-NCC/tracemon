define([
    "tracemon.env.utils"
], function(utils){

    var PathView = function(env, model, points) {
        this.id = utils.getIdFromIp(model.stateKey);
        this.model = model;
        this.points = points;
        this._hovered = false;
    };


    PathView.prototype = {

        isHovered: function(hovered){
            if (hovered === undefined){
                return this._hovered && !this.isFocusOut();
            } else {
                this._hovered = hovered;
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