
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
            var traceroute, host, hostId, attempt, lastHost, tracerouteId, edgeId;
            $this.nodes = {};
            $this.edges = {};
            $this.traceroutes = {};

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){
                traceroute = traceroutesToDraw[n];
                $this.nodes[traceroute.source.getId()] = traceroute.source;
                lastHost = traceroute.source;

                tracerouteId = utils.getIdFromIp(traceroute.source.getId() + '-' + traceroute.target.getId());

                $this.traceroutes[tracerouteId] = {
                    points: this._getPointsFromTraceroute(traceroute),
                    id: tracerouteId
                };

                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;

                    hostId = host.getId();
                    $this.nodes[hostId] = host;

                    if (lastHost && lastHost.getId() != host.getId()){
                        edgeId = lastHost.getId() + '-' + hostId;

                        $this.edges[edgeId] = {
                            start: lastHost,
                            stop: host,
                            traceroute: tracerouteId
                        };
                    }

                    lastHost = host;
                });
            }
        };

        this.draw = function(diff, callback){
            var traceroutesToDraw;

            traceroutesToDraw = diff.newTraceroutes;
            this._computeLayout(this._computeMeshGraph());


            if (env.aggregateIPv6 || env.aggregateIPv4){
                // this._aggregate();
                // this._drawAggregated();
            } else {
                this.computeVisibleGraph(traceroutesToDraw);
            }

            env.mainView.graph.computeLayout();

            // this._drawEdges();
            this._drawPaths();
            this._drawNodes();
            callback();
        };

        this.update = function(diff, callback){
            var traceroutesToDraw;

            traceroutesToDraw = diff.updatedTraceroutes;
            this._computeLayout(this._computeMeshGraph());
            // if (env.aggregateIPv6 || env.aggregateIPv4){
            //     // this._aggregate();
            //     // this._drawAggregated();
            // } else {
            this.computeVisibleGraph(diff.status);
            // }

            env.mainView.graph.computeLayout();

            for (var change in diff.updatedTraceroutes) {
                this._animatePathChange(diff.updatedTraceroutes[change]["before"], diff.updatedTraceroutes[change]["now"]);
            }

            this._drawPaths();
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

                    if (previousHost.getId() != host.getId()) {
                        nodes[host.getId()] = host;
                        edges[previousHost.getId() + "-" + host.getId()] = [previousHost, host];
                        previousHost = host;
                    }

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
                .data(nodesToDraw, function(element){
                    return element.id;
                });

            d3Data
                .exit()
                .transition()
                .duration(config.transitionsTimes.nodeRemoval)
                .style("opacity", 0.1)
                .each("end", function(){
                    d3.select(this).remove();
                });

            d3Data
                .enter()
                .append("circle");

            d3Data
                .attr("class", this._getNodeClass)
                .transition()
                .duration(4000)
                .attr("r", config.graph.nodeRadius)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        };

        this._drawPaths = function(){
            var edge, points, path, paths, d3Data, lineFunction;

            cache.edges = $.map(this.edges, function(edge){
                return env.mainView.graph.getEdge(edge.start.getId(), edge.stop.getId());
            });

            lineFunction = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate(config.graph.pathInterpolation);

            paths = $.map(this.traceroutes, function(path){
                return {
                    d: lineFunction(path.points),
                    id: path.id
                };
            });


            // for (var n=0,length=cache.edges.length; n<length; n++){
            //     edge = cache.edges[n];
            //
            //     points = [];
            //     if (edge.from != edge.to) {
            //         points.push(env.mainView.graph.getNode(edge.from));
            //         points = points.concat(edge.points);
            //         points.push(env.mainView.graph.getNode(edge.to));
            //
            //         pathId = utils.getIdFromIp(edge.id);
            //         paths.push({
            //             id: pathId,
            //             d: lineFunction(points),
            //             class: "edge edge-normal edge-" + pathId
            //         });
            //     }
            // }

            d3Data = env.mainView.pathsContainer
                .selectAll("path.path-normal")
                .data(paths, function(path){
                    return path.id;
                });

            d3Data
                .exit()
                .remove();

            d3Data
                .enter()
                .append("path");

            d3Data
                .attr("class", function(path){
                    return "path path-normal path-" + path.id;
                })
                .transition()
                .attr("d", function(path){
                    return path.d;
                });
        };


        // this._drawEdges = function(){
        //     var edge, points, path, paths, d3Data, pathId;
        //
        //     paths = [];
        //
        //     cache.edges = $.map(this.edges, function(edge){
        //         return env.mainView.graph.getEdge(edge.start.getId(), edge.stop.getId());
        //     });
        //
        //     var lineFunction = d3.svg.line()
        //         .x(function(d) { return d.x; })
        //         .y(function(d) { return d.y; })
        //         .interpolate("basis");
        //
        //
        //     for (var n=0,length=cache.edges.length; n<length; n++){
        //         edge = cache.edges[n];
        //
        //         points = [];
        //         if (edge.from != edge.to) {
        //             points.push(env.mainView.graph.getNode(edge.from));
        //             points = points.concat(edge.points);
        //             points.push(env.mainView.graph.getNode(edge.to));
        //
        //             pathId = utils.getIdFromIp(edge.id);
        //             paths.push({
        //                 id: pathId,
        //                 d: lineFunction(points),
        //                 class: "edge edge-normal edge-" + pathId
        //             });
        //         }
        //     }
        //
        //     if (paths.indexOf(undefined) >= 0){
        //         console.log(paths);
        //     }
        //     d3Data = env.mainView.pathsContainer
        //         .selectAll("path.edge-normal")
        //         .data(paths, function(path){
        //             return path.id;
        //         });
        //
        //     d3Data
        //         .exit()
        //         .remove();
        //
        //     d3Data
        //         .enter()
        //         .append("path");
        //
        //     d3Data
        //         .attr("class", function(path){
        //             return path.class;
        //         })
        //         .transition()
        //         .duration(4000)
        //         .attr("d", function(path){
        //             return path.d;
        //         });
        // };

        this._animatePathChange = function (oldTraceroute, newTraceroute) {
            var tracerouteId, element, lineFunction;

            tracerouteId = utils.getIdFromIp(oldTraceroute.source.getId() + '-' + oldTraceroute.target.getId());

            lineFunction = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate(config.graph.pathInterpolation);

            element = env.mainView.pathsContainer
                .select("path.path-" + tracerouteId);

            setTimeout(function(){
                element.style("stroke-width", "8px");
            }, config.transitionsTimes.pathChange);

            element
                .style("stroke-width", "15px")
                .transition()
                .duration(config.transitionsTimes.pathChange)
                .ease("linear")
                .attr("d", lineFunction(this._getPointsFromTraceroute(newTraceroute)));

        };

        this._getPointsFromTraceroute = function(traceroute){
            var edge, points, pathId, unifiedPathArray, hosts, edgeSet;

            unifiedPathArray = [];
            hosts = traceroute.getHostList();

            for (var n=0,length=hosts.length; n<length-1; n++){
                if (hosts[n].getId() != hosts[n + 1].getId()) {
                    unifiedPathArray.push(env.mainView.graph.getEdge(hosts[n].getId(), hosts[n + 1].getId()));
                }
            }

            points = [];
            for (var n=0,length=unifiedPathArray.length; n<length; n++){
                edge = unifiedPathArray[n];

                points.push(env.mainView.graph.getNode(edge.from));
                points = points.concat(edge.points);
                points.push(env.mainView.graph.getNode(edge.to));
                pathId = utils.getIdFromIp(edge.id);
            }

            return points;
        };

        this._setListeners();
    };


    return SingleHostView;
});