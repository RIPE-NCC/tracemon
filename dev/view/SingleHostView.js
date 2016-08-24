
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
        var $this, labelPlacement, cache, nodeBBox;

        $this = this;
        nodeBBox = (config.graph.nodeRadius * 2) + 5;
        labelPlacement = new LabelPlacement(nodeBBox, nodeBBox, 12);

        cache = {};
        this.nodes = {};
        this.edges = {};

        this._calculateLabelPosition = function(node){
            var where;

            if (!cache.edgePoints) {
                cache.edgePoints = $.map(cache.edges, function (nodeView) {
                    return [nodeView.points];
                });
            }
            where = labelPlacement.getLabelPosition(node, cache.edgePoints, node.label);

            node.labelPosition = where;
        };

        this._drawOrUpdateLabels = function(labels){
            var d3Data;

            d3Data = env.mainView.svg
                .selectAll("text.node-label")
                .data(labels);

            d3Data
                .exit()
                .remove();

            d3Data
                .enter()
                .append("text")
                .attr("class", function(label){
                    return "node-label node-label-" + utils.getIdFromIp(label.id);
                });

            d3Data
                .attr("x", function(label){
                    return label.labelPosition.x;
                })
                .attr("y", function(label){
                    return label.labelPosition.y;
                })
                .text(function(label){
                    return label.label;
                })
                .style("text-anchor", function(label){
                    return label.labelPosition.alignment;
                })
                .attr("transform", function(label){
                    if (label.labelPosition.direction ==  "vertical"){
                        return "rotate(-60," + label.labelPosition.x + "," + label.labelPosition.y + ")";
                    }
                    return null;
                })

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
            env.mainView.svg
                .select(".node-" + utils.getIdFromIp(host.getId()))
                .attr("class", this._getNodeClass);
            this._updateLabel(host);
        };

        // this._aggregate = function(){
        //     var nodeObj, edgeObj, finalNodes, nodeKey, edgeKey1, edgeKey2, finalEdges, edgeKey, subnet;
        //
        //     finalNodes = {};
        //     finalEdges = {};
        //
        //     subnet = env.aggregateIPv4;
        //
        //     for (var node in this.nodes){
        //
        //         nodeObj = this.nodes[node];
        //
        //         if (nodeObj.ip) {
        //             nodeKey = prefixUtils.encodePrefix(nodeObj.ip).substring(0, subnet + 1);
        //
        //             if (finalNodes[nodeKey]) {
        //                 finalNodes[nodeKey].multiplicity++;
        //             } else {
        //                 finalNodes[nodeKey] = nodeObj;
        //             }
        //         }
        //     }
        //
        //     for (var edge in this.edges){
        //         edgeObj = this.edges[edge];
        //
        //         if (edgeObj[0].ip && edgeObj[1].ip) {
        //
        //             edgeKey1 = prefixUtils.encodePrefix(edgeObj[0].ip).substring(0, subnet + 1);
        //             edgeKey2 = prefixUtils.encodePrefix(edgeObj[1].ip).substring(0, subnet + 1);
        //
        //             edgeKey = edgeKey1 + "-" + edgeKey2;
        //
        //             if (edgeObj[0] && edgeObj[1] && edgeKey1 != edgeKey2) {
        //                 finalEdges[edgeKey] = edgeObj;
        //             }
        //         }
        //     }
        //
        //     this.nodes = finalNodes;
        //     this.edges = finalEdges;
        // };

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
            $this.nodes = {};
            $this.edges = {};

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


            if (env.aggregateIPv6 || env.aggregateIPv4){
                // this._aggregate();
                // this._drawAggregated();
            } else {
                this.computeVisibleGraph(traceroutesToDraw);
            }

            env.mainView.graph.computeLayout();

            this._drawEdges();
            this._drawNodes();
            callback();
        };

        this.update = function(traceroutesToDraw, callback){
            this._computeLayout(this._computeMeshGraph());
            // if (env.aggregateIPv6 || env.aggregateIPv4){
            //     // this._aggregate();
            //     // this._drawAggregated();
            // } else {
                this.computeVisibleGraph(traceroutesToDraw);
            // }

            env.mainView.graph.computeLayout();

            this._drawEdges();
            this._drawNodes();
            callback();
        };

        // this._drawAggregated = function () {
        //     var nodeObj, edgeObj;
        //
        //     for (var node in this.nodes) {
        //         nodeObj = this.nodes[node];
        //         env.mainView
        //             .graph
        //             .addNode(node, {
        //                 label: $this.getNodeLabel(nodeObj),
        //                 class: "type-" + utils.getIdFromIp(nodeObj.getId()),
        //                 width: config.graph.nodeRadius,
        //                 height: config.graph.nodeRadius
        //             });
        //     }
        //
        //     for (var edge in this.edges) {
        //         edgeObj = this.edges[edge];
        //         env.mainView
        //             .graph
        //             .addEdge(edge.split("-")[0], edge.split("-")[1], {
        //                 interpolation: 'basis'
        //             });
        //     }
        //
        // };

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
            var nodesToDraw, d3Data;

            nodesToDraw = $.map($this.nodes, function(node){
                var nodeView = env.mainView.graph.getNode(node.getId());
                nodeView.model = node;
                return nodeView;
            });

            labelPlacement.setNodes(nodesToDraw);

            for (var n=0,length=nodesToDraw.length; n<length; n++) {
                $this._calculateLabelPosition(nodesToDraw[n]);
            }

            $this._drawOrUpdateLabels(nodesToDraw);

            d3Data = env.mainView.nodesContainer
                .selectAll("circle")
                .data(nodesToDraw);

            d3Data
                .exit()
                .remove();

            d3Data
                .enter()
                .append("circle");

            d3Data
                .attr("class", this._getNodeClass)
                .attr("r", config.graph.nodeRadius)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        };

        this._drawEdges = function(){
            var edge, points, path, paths, d3Data;

            paths = [];

            cache.edges = $.map(this.edges, function(edge){
                return env.mainView.graph.getEdge(edge[0].getId(), edge[1].getId());
            });

            var lineFunction = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate("basis");

            for (var n=0,length=cache.edges.length; n<length; n++){
                edge = cache.edges[n];

                points = [];
                points.push(env.mainView.graph.getNode(edge.from));
                points = points.concat(edge.points);
                points.push(env.mainView.graph.getNode(edge.to));

                paths.push({
                    d: lineFunction(points),
                    class: "edge edge-" + utils.getIdFromIp(edge.id)
                });

            }



            d3Data = env.mainView.pathsContainer
                .selectAll("path")
                .data(paths);

            d3Data
                .exit()
                .remove();

            d3Data
                .enter()
                .append("path");

            d3Data
                .attr("class", function(path){
                    return path.class;
                })
                .attr("d", function(path){
                    return path.d;
                });
        };

        this._setListeners();
    };


    return SingleHostView;
});