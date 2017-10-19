define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.view.single-host.label-view"
], function(utils, config, LabelView){

    var NodeView = function(env, model) {
        this.id = utils.getIdFromIp(model.getId());
        this.model = model;
        this.env = env;
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
        getAnnotation: function(){
            if (this.model.isLocalCache) {
                return "Local cache"
            } else if (this.model.isCdn){
                return "CDN"
            }

            return null;
        },

        getErrors: function(){
            var errors = [];

            for (var n=0,length=this.traceroutes.length; n<length; n++){
                errors = errors.concat(this.traceroutes[n].model.errors)
            }

            return errors;
        },

        isPathHovered: function(){
            var hoveredPath;

            hoveredPath = this.env.mainView.view.hoveredObject;
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
            this._graphNode = this.env.mainView.graph.getNode(this.model.getId());

            if (this._graphNode) {
                this.x = this._graphNode.x;
                this.y = this._graphNode.y;
            } else {
                throw "The node " + this.id + " is not in the graph";
            }
            // Update the svg involved
        },

        isFocusOut: function () {
            if (this.env.currentSearchResults) {
                var traceroutes = this.traceroutes;
                for (var n=0,length=traceroutes.length; n<length; n++){
                    if (this.env.currentSearchResults.in[traceroutes[n].model.id]){
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
            }

            if (this.model.isProbe) {
                classes.push("source");
            }

            if (this.model.isPrivate) {
                classes.push("private");
            }
            if (this.model.isTarget) {
                classes.push("target");
            }
            if (!this.model.ip) {
                classes.push("null");
            }

            return (selector) ? "." + classes.join(".") : classes.join(" ");
        },

        equalsTo: function(nodeView){
            return this.model.getId() == nodeView.model.getId()
                && nodeView.x;
        },

        _getHop: function(){
            if (!this._hop && this.traceroutes.length > 0){
                this._hop = this.traceroutes[0].model.getHop(this.model);
            }

            return this._hop;
        },

        _getHops: function(){
            var model = this.model;
            return this.traceroutes
                .map(function(traceroute){
                    return traceroute.model.getHop(model);
                });
        },

        getLatencies: function(){
            var hops, rtts;

            rtts = [];
            hops = this._getHops();
            if (hops.length > 0) {
                rtts = hops.map(function(hop){
                    var rtts;

                    if (hop){
                        rtts = hop.getAttempts()
                            .map(function(attempt){
                                return attempt.rtt;
                            });
                    }
                    return rtts;
                });

                rtts = [].concat.apply([], rtts);
                rtts = rtts.filter(function (rtt) {
                    return rtt != null;
                });
            }

            return rtts;
        },

        getMultiplicity: function(){
            var sameMultiplicity, hop;

            hop = this._getHop();
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
            var asObj, multiplicity, extras, location, templatingParams, links, latencies;

            try {
                location = this.model.getLocation();
            } catch(e){ // Geolocation is not applicable
                location = null;
            }

            multiplicity = this.getMultiplicity();
            latencies = this.getLatencies();
            links = {
                bgplay: config.externalLinks.bgplay.replace("0000", this.model.ip)
                    .replace("1111", this.env.finalQueryParams.startDate.unix())
                    .replace("2222", this.env.finalQueryParams.stopDate.unix())
            };
            extras = [];
            asObj = this.model.getAutonomousSystem();
            if (asObj) {
                for (var extra in asObj.extra) {
                    extras.push("" + extra.charAt(0).toUpperCase() + extra.slice(1) + ": " + asObj.extra[extra]);
                }

                links.whois = config.externalLinks.whois.replace("0000", asObj.id);
            }

            if (this.model.isIxp){
                links.peeringDb = config.externalLinks.peeringDb.replace("0000", this.model.ixp.peeringDbId);
            }

            templatingParams = {
                id: this.model.getId(),
                errors: this.getErrors(),
                isGuess: (this.model.isPrivate || !this.model.ip),
                ip: this.model.ip,
                as: asObj,
                asExtras: extras,
                location: location,
                ixp: (this.model.isIxp) ? this.model.ixp : null,
                multiplicity: {
                    value: multiplicity,
                    show: multiplicity > 1
                },
                links: links,
                rtt: ((latencies.length > 0) ? {
                    min: utils.truncateAt(Math.min.apply(null, latencies), 2),
                    max: utils.truncateAt(Math.max.apply(null, latencies), 2)
                } : null)
            };

            return this.env.template.getHostPopoverContent(templatingParams);
        }

    };



    return NodeView;
});