define([
    "tracemon.env.utils"
], function(utils){

    var LabelView = function(env, nodeView) {
        this.id = nodeView.id;
        this.node = nodeView;
        this.type = "labelView";
        this.x = null;
        this.y = null;
        this.alignment = null;
        this._cache = {};
    };


    LabelView.prototype = {


        isSelected: function(){
            return this.node.isSelected();
        },

        isVisible: function(){
            var isVisible;

            isVisible = !this.isFocusOut()
                && (this.isSelected()
                    || this.isHovered()
                    || !env.mainView.view.hoveredObject
                );



            return isVisible;
        },

        isHovered: function(){
            return this.node.isHovered();
        },

        update: function(){
            this.id = this.node.id;
        },

        _getDefaultLabel: function(){
            var label, nodeAs;

            nodeAs = this.node.model.getAutonomousSystem();
            if (this.node.model.isIxp && this.node.model.ixp.name){
                label = this.node.model.ixp.name;
                if (nodeAs){
                    label += ' (AS' + nodeAs.id + ')';
                }
            } else if (this.node.model.isProbe) {
                label = "Probe " + this.node.model.probeId;
                if (nodeAs){
                    label += ' (AS' + nodeAs.id + ')';
                }
            } else if (this.node.model.ip == null){
                label = "✱ ";
                if (nodeAs){
                    label += ' (Guess AS' + nodeAs.id + ')';
                }
            } else {
                label = this.node.model.ip;
                if (nodeAs){
                    label += ' (AS' + nodeAs.id + ')';
                }
            }

            return label;
        },


        getText: function(){
            var label;

            switch (env.labelLevel){
                case "geo":
                    if (this.node.model.getLocation() !== undefined){
                        label = this.node.model.getLocation().country;
                    } else if (!this._cache.geoLoading){
                        this._cache.geoLoading = env.connector
                            .getGeolocation(this.node.model);
                        label = "loading...";
                    }
                    break;

                case "reverse-lookup":
                    if (this.node.model.reverseDns !== undefined){
                        label = (this.node.model.reverseDns) ? this.node.model.reverseDns.complete : "";
                    } else if (!this._cache.reverseLoading) {
                        this._cache.reverseLoading = env.connector
                            .getHostReverseDns(this.node.model);
                        label = "loading...";
                    }
                    break;
            }

            return label || this._getDefaultLabel();
        },

        isFocusOut: function () {
            return this.node.isFocusOut();
        },


        getShortText: function(){
            var label, nodeAs, multiplicity;

            label = ""; // Empty if no short label available!
            nodeAs = this.node.model.getAutonomousSystem();
            switch (env.labelLevel){
                case "geo":
                    label = this.getText();
                    break;

                case "reverse-lookup":
                    if (this.node.model.reverseDns !== undefined){
                        label = (this.node.model.reverseDns) ? this.node.model.reverseDns.short : "";
                    } else if (!this._cache.reverseLoading) {
                        this._cache.reverseLoading = env.connector
                            .getHostReverseDns(this.node.model);
                        label = "loading...";
                    }
                    break;

                case "ip":
                    if (this.node.model.isIxp && this.node.model.ixp.name){
                        label = this.node.model.ixp.name;
                    } else if (nodeAs && this.node.model.ip){
                        label = (nodeAs.shortName) ? nodeAs.shortName : "AS" + nodeAs.id;
                    } else if (!this.node.model.ip){
                        multiplicity = this.node.getMultiplicity();
                        label = "✱" + ((multiplicity && multiplicity > 1) ? "x" + multiplicity : "");
                    }

                    break;
            }

            return label;
        },

        getClass: function(selector){
            var classes;

            classes = ["node-label", "node-label-" + utils.getIdFromIp(this.id)];

            if (this.node.model.isProbe){
                classes.push("probe");
            }

            if (this.node.model.isIxp){
                classes.push("ixp");
            }

            if (this.node.model.isTarget){
                classes.push("target");
            }

            if (this.node.model.isLast){
                classes.push("last");
            }

            return (selector) ? classes.join(".") : classes.join(" ");
        },

        getDynamicText: function(){
            return (this.node.isHovered() || this.node.isPathHovered()) ? this.getText() : this.getShortText();
        }

    };



    return LabelView;
});