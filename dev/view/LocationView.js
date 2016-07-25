
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.lib.parsePrefix"
], function(utils, config, lang, $, d3, prefixUtils){

    var LocationView = function(env){
        var $this, aggregationBy;

        $this = this;
        this.nodes = {};
        this.edges = {};
        aggregationBy = "country";


        this._getLocationKey = function(host){

            if (!host.location){
                return host.getId();
            }

            switch(aggregationBy) {

                case "country":
                    return host.location["country"];
                    break;

                case "city":
                    return host.location["country"] + '-' + host.location["city"];
                    break;

                default:
                    throw "Select an aggregation"

            }

        };


        this._locatePrivateHosts = function(traceroutesToDraw){
            var traceroute, host, attempt, hostTmp, hop, lastLocatedHost, hops;

            var cagata1;


            for (var n=0,length=traceroutesToDraw.length; n<length; n++) {
                traceroute = traceroutesToDraw[n];
                hops = traceroute.getHops();
                lastLocatedHost = null;
                cagata1 = [];
                lastLocatedHost = traceroute.source;

                for (var n1=0,length1=hops.length; n1<length1; n1++) {

                    hop = hops[n1];
                    attempt = hop.getMainAttempt();
                    host = attempt.host;

                    cagata1.push(host);

                    if (host.location){ // This node has a location
                        lastLocatedHost = host;

                    } else if (lastLocatedHost){ // No location

                        for (var n2=n1; n2<length1; n2++) { // Find the next valid location
                            hostTmp = hops[n2].getMainAttempt().host;
                            if (hostTmp.location && hostTmp.location.country == lastLocatedHost.location.country) { // Its a cycle on the same location
                                host.location = lastLocatedHost.location;
                                break;
                            }
                        }
                    }
                }

                // console.log($.map(cagata1, function(item){return ((item.location) ? item.location.country : item.getId())}));
            }
        };

        this.draw = function(traceroutesToDraw, callback){
            console.log("Loading...");

            this._init(traceroutesToDraw, function () {
                var traceroute, host, attempt, nodeKey, previousNode, nodeObj;

                $this._locatePrivateHosts(traceroutesToDraw);
                for (var n=0,length=traceroutesToDraw.length; n<length; n++) {
                    traceroute = traceroutesToDraw[n];

                    nodeKey = $this._getLocationKey(traceroute.source);
                    if (!$this.nodes[nodeKey]) {
                        $this.nodes[nodeKey] = { hosts: {}, label: nodeKey, id: utils.getIdFromIp(nodeKey) };
                    }
                    $this.nodes[nodeKey]["hosts"][traceroute.source.getId()] = traceroute.source;
                    previousNode = $this.nodes[nodeKey];

                    nodeKey = traceroute.target.ip;
                    if (!$this.nodes[nodeKey]) {
                        $this.nodes[nodeKey] = { hosts: {}, label: nodeKey, id: utils.getIdFromIp(nodeKey) };
                    }
                    $this.nodes[nodeKey]["hosts"][traceroute.target.getId()] = traceroute.target;


                    traceroute.forEachHop(function(hop){
                        attempt = hop.getMainAttempt();
                        host = attempt.host;

                        if (host.ip != traceroute.target.ip) {
                            nodeKey = $this._getLocationKey(host);
                        } else {
                            nodeKey = traceroute.target.ip;
                        }


                        // nodeKey = $this._getLocationKey(host);

                        if (!$this.nodes[nodeKey]) {
                            $this.nodes[nodeKey] = {hosts: {}, label: nodeKey, id: utils.getIdFromIp(nodeKey)};
                        }
                        $this.nodes[nodeKey]["hosts"][host.getId()] = host;

                        nodeObj = $this.nodes[nodeKey];
                        if (previousNode && previousNode.id != nodeObj.id){ // check existence of previous node and remove cycles
                            $this.edges[previousNode.id + '-' + nodeObj.id] = [previousNode, nodeObj];
                        }
                        previousNode = nodeObj;
                    });

                    previousNode = null;
                }

                $this._drawPlain();
                callback();

                console.log("Loaded");
            });

        };


        this._init = function(traceroutesToDraw, callback){
            var traceroute, host, attempt, calls;

            calls = [];
            for (var n=0,length=traceroutesToDraw.length; n<length; n++){
                traceroute = traceroutesToDraw[n];

                calls.push(env.connector.getGeolocation(traceroute.source));
                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;
                    calls.push(env.connector.getGeolocation(host));
                });

            }

            $.when
                .apply($, calls)
                .done(callback)
                .fail($this._onLoadingError);
        };

        this._onLoadingError = function(error){
            console.log("Loading error: " + error);
        };


        this._drawPlain = function(){
            var nodeObj, edgeObj;

            for (var node in this.nodes) {

                nodeObj = this.nodes[node];

                env.mainView.graph.setNode(nodeObj.id, {
                    label: nodeObj.label,
                    class: "type-" + nodeObj.id
                });

            }

            for (var edge in this.edges) {
                edgeObj = this.edges[edge];
                env.mainView.graph.setEdge(edgeObj[0].id, edgeObj[1].id, { lineInterpolate: 'basis' });
            }

        };
    };


    return LocationView;
});