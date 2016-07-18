
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd"
], function(utils, config, lang, $, d3){

    var ASView = function(env){

        var $this;

        $this = this;
        this.nodes = {};
        this.edges = {};

        this.draw = function(traceroutesToDraw){
            var traceroute, host, edgeKey, attempt, nodeObj, edgeObj, asObj, previousAS;

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){
                traceroute = traceroutesToDraw[n];
                previousAS = null;

                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;

                    asObj = host.getAutonomousSystem();

                    if (asObj) {
                        $this.nodes[asObj.id] = asObj;

                        if (previousAS && previousAS.id != asObj.id) {
                            edgeKey = previousAS.id + '-' + asObj.id;
                            $this.edges[edgeKey] = [previousAS, asObj];
                        }

                        previousAS = asObj;
                    }
                });



                for (var node in this.nodes){
                    nodeObj = this.nodes[node];
                    env.mainView.graph.setNode(nodeObj.id,  { label: nodeObj.id, class: "type-" + nodeObj.id });
                }

                for (var edge in this.edges){
                    edgeObj = this.edges[edge];

                    env.mainView.graph.setEdge(edgeObj[0].id, edgeObj[1].id);
                }

            }

        };
        
        

    };


    return ASView;
});