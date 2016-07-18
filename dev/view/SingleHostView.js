
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.lib.parsePrefix"
], function(utils, config, lang, $, d3, prefixUtils){

    var SingleHostView = function(env){
        var $this;

        $this = this;
        this.nodes = {};
        this.edges = {};

        this._aggregate = function(){
            var nodeObj, edgeObj, finalNodes, nodeKey, edgeKey1, edgeKey2, finalEdges, edgeKey, subnet;

            finalNodes = {};
            finalEdges = {};

            subnet = env.aggregateIPv4;

            for (var node in this.nodes){

                nodeObj = this.nodes[node];

                if (nodeObj.ip) {
                    nodeKey = prefixUtils.encodePrefix(nodeObj.ip).substring(0, subnet + 1);

                    if (finalNodes[nodeKey]) {
                        finalNodes[nodeKey].multiplicity++;
                    } else {
                        finalNodes[nodeKey] = nodeObj;
                    }
                }
            }

            for (var edge in this.edges){
                edgeObj = this.edges[edge];

                if (edgeObj[0].ip && edgeObj[1].ip) {

                    edgeKey1 = prefixUtils.encodePrefix(edgeObj[0].ip).substring(0, subnet + 1);
                    edgeKey2 = prefixUtils.encodePrefix(edgeObj[1].ip).substring(0, subnet + 1);

                    edgeKey = edgeKey1 + "-" + edgeKey2;

                    if (edgeObj[0] && edgeObj[1] && edgeKey1 != edgeKey2) {
                        finalEdges[edgeKey] = edgeObj;
                    }
                }
            }

            this.nodes = finalNodes;
            this.edges = finalEdges;
        };

        this.draw = function(traceroutesToDraw){
            var traceroute, host, hostId, attempt, lastHostId, nodeObj, edgeObj, lastHost;

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){
                traceroute = traceroutesToDraw[n];
                lastHost = null;
                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;
                    hostId = host.getId();

                    $this.nodes[hostId] = host;

                    if (lastHost && lastHost.getId() != host.getId()){
                        $this.edges[lastHost.getId() + '-' + hostId] = [lastHost, host];
                    }

                    lastHost = host;
                });

            }

            if (env.aggregateIPv6 || env.aggregateIPv4){
                this._aggregate();
                this._drawAggregated();
            } else {
                this._drawPlain();
            }



        };

        this._drawPlain = function(){
            var nodeObj, edgeObj;

            for (var node in this.nodes) {
                nodeObj = this.nodes[node];
                env.mainView.graph.setNode(nodeObj.getId(), {
                    label: nodeObj.getId(),
                    class: "type-" + utils.getIdFromIp(nodeObj.getId())
                });

            }

            for (var edge in this.edges) {
                edgeObj = this.edges[edge];
                env.mainView.graph.setEdge(edgeObj[0].getId(), edgeObj[1].getId());
            }

        };

        this._drawAggregated = function () {
            var nodeObj, edgeObj;

            for (var node in this.nodes) {
                nodeObj = this.nodes[node];
                env.mainView.graph.setNode(node, {
                    label: nodeObj.getId(),
                    class: "type-" + utils.getIdFromIp(nodeObj.getId())
                });
            }

            for (var edge in this.edges) {
                edgeObj = this.edges[edge];
                env.mainView.graph.setEdge(edge.split("-")[0], edge.split("-")[1]);
            }

        }

    };


    return SingleHostView;
});