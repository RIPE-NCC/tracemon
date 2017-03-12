define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.view.single-host.label-view"
], function(utils, config, LabelView){

    var NodeView = function(env, model) {
        this.id = utils.getIdFromIp(model.getId());
        this.model = model;
        this.traceroutes = [];
        this.type = "nodeView";
        this._hovered = false;
        this._selected = false;
        this._graphNode = null;
        this.label = new LabelView(env, this);
        this.x = null;
        this.y = null;
    };


    NodeView.prototype = {
        getErrors: function(){
            var errors = [];

            for (var n=0,length=this.traceroutes.length; n<length; n++){
                errors = errors.concat(this.traceroutes[n].model.errors)
            }

            return errors;
        },

        isPathHovered: function(){
            var hoveredPath;

            hoveredPath = env.mainView.view.hoveredObject;
            if (hoveredPath && hoveredPath.type == "pathView"){
                for (var n=0,length=this.traceroutes.length; n<length; n++){
                    if (this.traceroutes[n].model.stateKey == hoveredPath.model.stateKey){
                        return true;
                    }
                }
            }

            return false;
        },

        isSelected: function (selected) {
            if (selected === undefined){
                return this._selected && !this.isFocusOut();
            } else {
                this._selected = selected;
            }
        },

        isHovered: function(hovered){

            if (hovered === undefined){
                return this._hovered && !this.isFocusOut();
            } else if (!this.isFocusOut()){
                this._hovered = hovered;
                for (var n=0,length=this.traceroutes.length; n<length; n++){
                    this.traceroutes[n].isSelected(hovered);
                }

            }
        },

        getRadius: function(){
            return (this.isHovered() || this.isSelected()) ? config.graph.nodeSelectedRadius : config.graph.nodeRadius;
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
                    if (env.currentSearchResults.in[traceroutes[n].model.id]){
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

        getMultiplicity: function(){
            var sameMultiplicity, hop;

            hop = this.traceroutes[0].model.getHop(this.model);
            sameMultiplicity = (hop) ? hop.multiplicity : null;
            for (var n=1; n<this.traceroutes.length; n++){
                hop = this.traceroutes[n].model.getHop(this.model);
                if (!sameMultiplicity && hop){
                    sameMultiplicity = hop.multiplicity;
                }
                sameMultiplicity = (hop && hop.multiplicity != sameMultiplicity) ? false : sameMultiplicity;
            }

            return sameMultiplicity;
        },



        getInfo: function () {
            var out, guess, asObj, multiplicity, errors, geoloc;

            out = "";
            errors = this.getErrors();
            multiplicity = this.getMultiplicity();
            geoloc = this.model.getLocation();

            if (errors.length > 0){
                out += "<span class='node-error'>" + errors.join("<br>") + "</span><br>";
            }

            guess = (this.model.isPrivate || !this.model.ip);
            out += (!this.model.ip && multiplicity && multiplicity > 1) ? "Repeated " + multiplicity + " times<br>" : "";
            out += (this.model.ip) ? "IP: " + this.model.ip + "<br>" : "";
            out += (geoloc) ? "Located in: " + [geoloc.city, geoloc.countryCode].filter(function(item){return item!=null && item!="";}).join(", ") + "<br>" : "";

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