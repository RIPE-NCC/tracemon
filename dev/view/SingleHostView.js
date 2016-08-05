
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.lib.parsePrefix",
    "tracemon.view.label-placement"
], function(utils, config, lang, $, d3, prefixUtils, LabelPlacement){

    var SingleHostView = function(env){
        var $this, labelPlacement;

        $this = this;
        this.nodes = {};
        this.edges = {};

        labelPlacement = new LabelPlacement();


        this._drawOrUpdateLabel = function(node){
            var where, outEdges, inEdges, nodeEdges;

            nodeEdges = [];
            // outEdges = env.mainView.graph.getEdge(node.id, null);
            // inEdges = env.mainView.graph.getEdge(null, node.id);
            //
            // for (var edgeKey in outEdges){
            //     nodeEdges.push(outEdges[edgeKey].points);
            // }
            //
            // for (var edgeKey in inEdges){
            //     nodeEdges.push(inEdges[edgeKey].points);
            // }

            //
            for (var edgeKey in this.edges){
                var edge = this.edges[edgeKey];
                var nodeView = env.mainView.graph.getEdge(edge[0].getId(), edge[1].getId());
                nodeEdges.push(nodeView.points);

            }


            // nodeEdges = $.map(this.edges, function(edge){
            //     return env.mainView.graph.getEdge(edge[0].getId(), edge[1].getId()).points;
            // });


            where = labelPlacement.getLabelPosition(node, nodeEdges);

            d3.select("svg")
                .append("text")
                .attr("x", where.x)
                .attr("y", where.y)
                .text(node.label)
                .style("text-anchor", where.alignment)
                .attr("transform", function(){
                    if (where.direction ==  "vertical"){
                        return "rotate(-60," + where.x + "," + where.y + ")";
                    }
            
                    return null;
                })
                .attr("class", "node-label node-label-" + utils.getIdFromIp(node.id));

        };


        this._updateLabel = function(host){
            var nodeView = env.mainView.graph.getNode(host.getId());

            nodeView.label = this.getNodeLabel(host);
            d3.select(".node-label-" + utils.getIdFromIp(nodeView.id))
                .text(nodeView.label);
        };


        this._setListeners = function(){
            utils.observer.subscribe("ixp-detected", this._updateIxp, this);
        };

        this._updateIxp = function(host){
            // console.log("ixp: ", utils.getIdFromIp(host.getId()));
            d3.select("svg")
                .select(".node-" + utils.getIdFromIp(host.getId()))
                .attr("class", this._getNodeClass);
            this._updateLabel(host);
        };

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

        this.getNodeLabel = function (host){
            if (host.isIxp){
                return host.ixp.name;
            } else if (host.isProbe) {
                return "Probe " + host.probeId + ((host.getAutonomousSystem()) ? " (AS" + host.getAutonomousSystem().id + ")" : "");
            } else if (host.ip == null){
                return "* " + ((host.getAutonomousSystem()) ? " (AS" + host.getAutonomousSystem().id + ")" : "");
            } else {
                return host.ip + ((host.getAutonomousSystem()) ? " (AS" + host.getAutonomousSystem().id + ")" : "");
            }
        };

        this.computeVisibleGraph = function(traceroutesToDraw){
            var traceroute, host, hostId, attempt, lastHost;

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){
                traceroute = traceroutesToDraw[n];
                $this.nodes[traceroute.source.getId()] = traceroute.source;
                lastHost = traceroute.source;

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
        };


        this.draw = function(traceroutesToDraw, callback){

            this._computeLayout(this._computeMeshGraph());
            this.computeVisibleGraph(traceroutesToDraw);

            // NOT WORKING ANYMORE
            //
            // if (env.aggregateIPv6 || env.aggregateIPv4){
            //     this._aggregate();
            //     this._drawAggregated();
            // } else {
            // this._drawPlain(); // Draw visible layout
            // }

            // callback();
            env.mainView.graph.computeLayout();

            this._drawEdges();
            this._drawNodes();

        };

        this._drawPlain = function(){
            var nodeObj, edgeObj;

            for (var node in this.nodes) {
                nodeObj = this.nodes[node];
                env.mainView
                    .graph
                    .addNode(nodeObj.getId(), {
                        label: this.getNodeLabel(nodeObj),
                        class: "type-" + utils.getIdFromIp(nodeObj.getId()),
                        width: config.graph.nodeRadius,
                        height: config.graph.nodeRadius
                    });

            }

            for (var edge in this.edges) {
                edgeObj = this.edges[edge];
                env.mainView
                    .graph
                    .addEdge(edgeObj[0].getId(), edgeObj[1].getId(), {
                        interpolation: 'basis'
                    });
            }

        };


        this._drawAggregated = function () {
            var nodeObj, edgeObj;

            for (var node in this.nodes) {
                nodeObj = this.nodes[node];
                env.mainView
                    .graph
                    .addNode(node, {
                        label: $this.getNodeLabel(nodeObj),
                        class: "type-" + utils.getIdFromIp(nodeObj.getId()),
                        width: config.graph.nodeRadius,
                        height: config.graph.nodeRadius
                    });
            }

            for (var edge in this.edges) {
                edgeObj = this.edges[edge];
                env.mainView
                    .graph
                    .addEdge(edge.split("-")[0], edge.split("-")[1], {
                        interpolation: 'basis'
                    });
            }

        };

        this._computeMeshGraph = function(){
            var traceroutes, traceroute, edges, nodes, previousHost;

            nodes = {};
            edges = {};

            traceroutes = $.map(env.main.loadedMeasurements, function(item){
                return item.getTraceroutes();
            });

            for (var t=0,length = traceroutes.length; t<length; t++) {
                traceroute = traceroutes[t];
                previousHost = traceroute.source;
                nodes[previousHost.getId()] = previousHost;

                traceroute.forEachHop(function(hop){
                    var attempt, host;

                    attempt = hop.getMainAttempt();
                    host = attempt.host;

                    nodes[host.getId()] = host;
                    edges[previousHost.getId() + "-" + host.getId()] = [previousHost, host];

                    previousHost = host;
                });
            }

            return { nodes: nodes, edges: edges }
        };


        this._computeLayout = function(mesh){

            var nodeObj, edgeObj;

            for (var node in mesh.nodes) {
                nodeObj = mesh.nodes[node];
                env.mainView.graph.addNode(nodeObj.getId(), {
                    label: this.getNodeLabel(nodeObj),
                    class: "node-host-" + utils.getIdFromIp(nodeObj.getId()),
                    width: config.graph.nodeRadius,
                    height: config.graph.nodeRadius
                });
            }

            for (var edge in mesh.edges) {
                edgeObj = mesh.edges[edge];
                env.mainView.graph.addEdge(edgeObj[0].getId(), edgeObj[1].getId(), {
                    interpolation: 'basis',
                    class: "edge-host"
                });
            }

            env.mainView.graph.computeLayout();
        };

        this._getNodeClass = function(nodeView){
            var classes, host;

            host = nodeView.model;
            classes = "node node-" + utils.getIdFromIp(host.getId()) + " ";
            if (host.isIxp){
                classes += "ixp";
            } else if (host.isProbe) {
                classes += "source";
            } else if (host.isPrivate) {
                classes += "private";
            } else if (host.isTarget) {
                classes += "target";
            } else if (!host.ip) {
                classes += "null";
            }

            return classes;
        };

        this._drawNodes = function(){
            var nodesToDraw;

            nodesToDraw = $.map(this.nodes, function(node){
                console.log(node.getId());
                var nodeView = env.mainView.graph.getNode(node.getId());
                nodeView.model = node;
                return nodeView;
            });

            labelPlacement.setNodes(nodesToDraw);

            console.log(JSON.parse(JSON.stringify(nodesToDraw)));


            for (var n=0,length=nodesToDraw.length; n<length; n++) {
                $this._drawOrUpdateLabel(nodesToDraw[n]);
            }

            console.log(JSON.parse(JSON.stringify(nodesToDraw)));


            d3.select("svg")
                .append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(nodesToDraw)
                .enter()
                .append("circle")
                .attr("class", this._getNodeClass) // function(d){return "node node-" + utils.getIdFromIp(d.id);
                .attr("r", config.graph.nodeRadius)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        };




        this._drawEdges = function(){
            var edges, edge, points;

            edges = $.map(this.edges, function(edge){
                return env.mainView.graph.getEdge(edge[0].getId(), edge[1].getId());
            });

            var lineFunction = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate("basis");

            for (var n=0,length=edges.length; n<length; n++){
                edge = edges[n];

                points = [];
                points.push(env.mainView.graph.getNode(edge.from));
                points = points.concat(edge.points);
                points.push(env.mainView.graph.getNode(edge.to));

                d3.select("svg")
                    .append("g")
                    .attr("class", "edges")
                    .append("path")
                    .attr("class", "edge edge-" + utils.getIdFromIp(edge.id))
                    .attr("d", lineFunction(points));
            }
        };


        this._setListeners();
    };


    return SingleHostView;
});