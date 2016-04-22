
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd"
], function(utils, config, lang, $){

    var HostView = function(env, host, graph){
        this.drawn = false;
        this.model = host;

        this.node = graph.setNode(this.model.getId(),  { label: this.model.getId(), class: "type-" + this.model.getId() });
    };

    HostView.prototype.draw = function(){
        if (this.drawn) {
            return this.updateDraw();
        } else {
            console.log("drawn");
            // TO DO draw
        }
    };

    HostView.prototype.updateDraw = function(){
        console.log("updated");
        // TO DO update draw
    };


    HostView.prototype.updateLabel = function(type){

        switch(type) {

            case "domain":
                env.connector
                    .getHostReverseDns(this)
                    .done(function(domain){
                        // Update label content
                    });
                break;

            case "address":
                var label;

                label = this.model.ip;
                // Update label content
                break;

        }

    };



    return HostView;
});