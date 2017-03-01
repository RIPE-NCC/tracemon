define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.view.single-host.label-view"
], function(utils, config, LabelView){

    var NodeView = function(env, model) {
        this.id = utils.getIdFromIp(model.getId());
        this.model = model;
        this.traceroutes = [];
        this._hovered = false;
        this._graphNode = null;
        this.label = new LabelView(env, this);
        this.x = null;
        this.y = null;
    };


    NodeView.prototype = {
        isHovered: function(hovered){
            if (hovered === undefined){
                return this._hovered && !this.isFocusOut();
            } else {
                this._hovered = hovered;
            }
        },

        getRadius: function(){
            return (this.isHovered()) ? config.graph.nodeSelectedRadius : config.graph.nodeRadius;
        },

        update: function(){
            this.id = utils.getIdFromIp(this.model.getId());
            this._graphNode = env.mainView.graph.getNode(this.model.getId());

            if (this._graphNode) {
                this.x = this._graphNode.x;
                this.y = this._graphNode.y;
            } else {
                throw "The node " + this.id + " is not in the graph";
            }
            // Update the svg involved
        },

        isFocusOut: function () {
            if (env.currentSearchResults) {
                var traceroutes = this.traceroutes;
                for (var n=0,length=traceroutes.length; n<length; n++){
                    if (env.currentSearchResults.in[traceroutes[n].id]){
                        return false;
                    }
                }
                return true;
            }

            return false;
        },

        getClass: function(selector){
            var classes;

            classes = ["node", "node-" + this.id];

            if (this.model.isIxp){
                classes.push("ixp");
            } else if (this.model.isProbe) {
                classes.push("source");
            } else if (this.model.isPrivate) {
                classes.push("private");
            } else if (this.model.isTarget) {
                classes.push("target");
            } else if (!this.model.ip) {
                classes.push("null");
            }

            return (selector) ? classes.join(".") : classes.join(" ");
        },

        equalsTo: function(nodeView){
            return this.model.getId() == nodeView.model.getId()
                && nodeView.x;
        },

        getInfo: function () {
            var out, guess, asObj;

            out = "";
            guess = (this.model.isPrivate || !this.model.ip);
            out += (!this.model.ip && this.model.multiplicity > 1) ? "Repeated " + this.model.multiplicity + " times<br>" : "";
            out += (this.model.ip) ? "IP: " + this.model.ip + "<br>" : "";

            if (this.model.isIxp) {
                out += "IXP: " + this.model.ixp.name + ", " + this.model.ixp.city + ", " + this.model.ixp.country;
                out += "<br>Lan: " + this.model.ixp.prefix;
            }

            asObj = this.model.getAutonomousSystem();
            if (asObj) {
                out += "<br><b>" + ((guess) ? "Best guess:" : "Routing info:") + "</b><br>";
                out += "AS" + asObj.id + " - " + asObj.owner;
                out += "<br><br><b>Registry info:</b>";

                out += "<br> Announced: " + asObj.announced + "<br>";
                for (var extra in asObj.extra) {
                    out += extra.charAt(0).toUpperCase() + extra.slice(1) + ": " + asObj.extra[extra] + "<br>";
                }
            } else {
                out += "<br>No AS information available for this node";
            }

            return out;
        }


    };



    return NodeView;
});