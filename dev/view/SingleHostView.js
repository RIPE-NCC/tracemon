
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
        var $this, labelPlacement, cache, nodeBBox, currentSearch, lineFunction;

        $this = this;
        nodeBBox = (config.graph.nodeRadius * 2) + 5;
        labelPlacement = new LabelPlacement(nodeBBox, nodeBBox, 12);
        currentSearch = null;
        cache = {};
        lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate(config.graph.pathInterpolation);

        this.nodes = {};
        this.nodesArray = [];
        this.edges = {};
        this.traceroutes = {};

        env.labelLevel = "host";

        window.setLabelLevel = function(level){ // TEMPORARY
            env.labelLevel = level;
            console.log("This function pollutes the global env. Remove this!");
        };

        this._setListeners = function(){
            utils.observer.subscribe("model.host:ixp", this._updateIxp, this);
            utils.observer.subscribe("view.traceroute:mousein", function(traceroute){
                this._hoveredPath(traceroute, true);
            }, this);
            utils.observer.subscribe("view.traceroute:mouseout", function(traceroute){
                this._hoveredPath(traceroute, false);
            }, this);
        };

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

        this._drawOrUpdateLabels = function(nodes){
            var labelsSvg;

            labelsSvg = env.mainView.svg
                .selectAll("text.node-label")
                .data(nodes, function(element){
                    return element.id;
                });

            labelsSvg
                .exit()
                .remove();

            labelsSvg
                .enter()
                .append("text")
                .attr("class", function(node){
                    return "node-label node-label-" + utils.getIdFromIp(node.id);
                });

            labelsSvg
                .attr("data-focus-out", function (node) {
                    return node.focusOut;
                })
                .attr("x", function(node){
                    return node.labelPosition.x;
                })
                .attr("y", function(node){
                    return node.labelPosition.y;
                })
                .text(function(node){
                    return node.label;
                })
                .style("text-anchor", function(node){
                    return node.labelPosition.alignment;
                })
                .attr("transform", function(node){
                    if (node.labelPosition.direction ==  "vertical"){
                        return "rotate(-60," + node.labelPosition.x + "," + node.labelPosition.y + ")";
                    }
                    return null;
                })

        };

        this._updateLabel = function(host){
            var nodeView = env.mainView.graph.getNode(host.getId());

            try {
                nodeView.label = this.getNodeLabel(host);
                env.mainView
                    .svg
                    .selectAll(".node-label-" + utils.getIdFromIp(nodeView.id))
                    .text(nodeView.label);
            } catch (e){
                console.log(e);
            }
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

        this._getDefaultNodeLabel = function(host){

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

        this.getNodeLabel = function (host){

            switch (env.labelLevel){
                case "geo":
                    if (host.location !== undefined){
                        return (host.location) ? host.location.country : this._getDefaultNodeLabel(host) || this._getDefaultNodeLabel(host);
                    } else {
                        env.connector
                            .getGeolocation(host)
                            .done(function(label){
                                // try {
                                //     $this._updateLabel(host);
                                // }catch(e){
                                // }
                            });
                        return "loading";
                    }

                    break;
                case "reverseLookup":
                    if (host.reverseDns !== undefined){
                        return host.reverseDns || this._getDefaultNodeLabel(host);
                    } else {
                        env.connector
                            .getHostReverseDns(host)
                            .done(function(label){
                                // try {
                                //     $this._updateLabel(host);
                                // }catch(e){
                                // }
                            });
                        return "loading";
                    }
                    break;
                default:
                    return this._getDefaultNodeLabel(host);
            }

        };


        this.applySearch = function (searchResults) {
            currentSearch = searchResults;

            if (currentSearch) {
                this._updateNodesGraphAttributes();
                this._drawPaths();
                this._drawNodes();
            } else {
                env.mainView.svg
                    .selectAll(".node-label")
                    .attr("data-focus-out", null);

                env.mainView.nodesContainer
                    .selectAll(".node")
                    .attr("data-focus-out", null);

                env.mainView.pathsContainer
                    .selectAll(".path")
                    .attr("data-focus-out", null);
            }
        };

        this._createNodeView = function(host, traceroute){
            var nodeKey, nodeObj;

            nodeKey = host.getId();
            if (this.nodes[nodeKey]) { // The node exists already
                this.nodes[nodeKey].traceroutes.push(traceroute);
            } else {
                nodeObj = {
                    model: host,
                    traceroutes: [traceroute]
                };
                this.nodes[nodeKey] = nodeObj;
                this.nodesArray.push(nodeObj);
            }
        };

        this._createEdgeView = function (start, stop, traceroute) {
            var edgeId;

            if (start.getId() != stop.getId()) {
                edgeId = start.getId() + '-' + stop.getId();
                this.edges[edgeId] = {
                    start: start,
                    stop: stop,
                    traceroute: traceroute
                };
            }
        };

        this._createPathView = function (traceroute) {
            var tracerouteId;

            tracerouteId = utils.getIdFromIp(traceroute.stateKey);
            this.traceroutes[tracerouteId] = {
                model: traceroute,
                points: this._getPointsFromTraceroute(traceroute),
                id: tracerouteId
            };
        };

        this.computeVisibleGraph = function(traceroutesToDraw){
            var traceroute, host, attempt, lastHost;

            this.nodes = {};
            this.nodesArray = [];
            this.edges = {};
            this.traceroutes = {};

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){

                traceroute = traceroutesToDraw[n];
                lastHost = traceroute.source;

                this._createNodeView(lastHost, traceroute);
                this._createPathView(traceroute);

                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;
                    $this._createNodeView(host, traceroute);

                    if (lastHost){
                        $this._createEdgeView(lastHost, host, traceroute);
                    }

                    lastHost = host;
                });
            }

        };

        this._updateNodesGraphAttributes = function(){
            var node, graphAttributes;

            for (var n=0,length=this.nodesArray.length; n<length; n++){
                node = this.nodesArray[n];
                graphAttributes = env.mainView.graph.getNode(node.model.getId());
                node.x = graphAttributes.x;
                node.y = graphAttributes.y;
                node.id = node.model.getId();
                node.label = this.getNodeLabel(node.model);
                node.focusOut = this._isNodeFocusOut(node);
            }
        };

        this.draw = function(diff, callback){
            var traceroutesToDraw;

            traceroutesToDraw = diff.newTraceroutes;
            this._computeLayout(this._computeMeshGraph());
            this.computeVisibleGraph(traceroutesToDraw);
            env.mainView.graph.computeLayout();
            this._updateNodesGraphAttributes();
            this._drawPaths();
            this._drawNodes();
            callback();
        };

        this.update = function(diff, callback){

            currentSearch = env.headerController.updateSearch();
            this._computeLayout(this._computeMeshGraph());
            this.computeVisibleGraph(diff.status);
            env.mainView.graph.computeLayout();
            this._updateNodesGraphAttributes();

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

        this._showDirection = function (path, highlighted) {
            var marker;

            env.mainView.svg
                .selectAll(".dot.direction")
                .remove();

            if (highlighted) {
                marker = env.mainView.svg
                    .append("circle")
                    .attr("class", "dot direction");

                marker.attr("r", 4);
                transition();
            }

            function transition() {
                marker
                    .transition()
                    .duration(3000)
                    .attrTween("transform", translateAlong(path.node()));
            }

            function translateAlong(path) {
                var l = path.getTotalLength();
                return function (i) {
                    return function (t) {
                        var p = path.getPointAtLength(t * l);
                        return "translate(" + p.x + "," + p.y + ")"; //Move marker
                    }
                }
            }
        };

        this._hoveredPath = function(traceroute, hovered){
            var hosts, nodesToUpdate, nodes, path;

            hosts = traceroute.getHostList();

            nodesToUpdate = $.map(hosts, function(node){
                return env.mainView.graph.getNode(node.getId());
            });

            nodes = env.mainView.nodesContainer
                .selectAll("circle");

            nodes
                .data(nodesToUpdate, function(element){
                    return element.id;
                })
                .attr("data-hover", ((hovered) ? true : null))
                .attr("r", ((hovered) ? config.graph.nodeSelectedRadius : config.graph.nodeRadius));

            path = env.mainView.pathsContainer
                .selectAll("path.path-" + utils.getIdFromIp(traceroute.stateKey))
                .attr("data-hover", ((hovered) ? true : null));

            this._showDirection(path, hovered);
        };

        this._computeLayout = function(mesh){

            var nodeObj, edgeObj;

            for (var node in mesh.nodes) {
                nodeObj = mesh.nodes[node];
                env.mainView.graph.addNode(nodeObj.getId(), {
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

        this._getPathClass = function (pathView) {
            var cssClass = "path path-" + pathView.id;

            return cssClass;
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


        this._calculateLabelsPosition = function () {
            for (var n=0,length=this.nodesArray.length; n<length; n++) {
                $this._calculateLabelPosition(this.nodesArray[n]);
            }
        };

        this._drawNodes = function(){
            var nodesSvg;

            labelPlacement.setNodes(this.nodesArray);
            this._calculateLabelsPosition();
            this._drawOrUpdateLabels(this.nodesArray);

            nodesSvg = env.mainView.nodesContainer
                .selectAll("circle")
                .data(this.nodesArray, function(element){
                    return utils.getIdFromIp(element.id);
                });

            nodesSvg
                .exit()
                .transition()
                .duration(config.transitionsTimes.nodeRemoval)
                .style("opacity", 0.1)
                .each("end", function(){
                    d3.select(this).remove();
                });

            nodesSvg
                .enter()
                .append("circle")
                .attr("data-container", "body")
                .attr("data-toggle", "popover")
                .attr("data-placement", "right")
                .attr("data-html", "true")
                .attr("title", function(node){
                    return node.label;
                })
                .attr("data-content", function(d){
                    var asObj = d.model.getAutonomousSystem();
                    if (asObj){
                        var out = asObj.owner + "<br> Announced: " + asObj.announced + "<br>";
                        for (var extra in asObj.extra){
                            out += extra.charAt(0).toUpperCase() + extra.slice(1) + ": " + asObj.extra[extra] + "<br>";
                        }
                        return out;
                    }
                });

            nodesSvg
                .attr("class", this._getNodeClass)
                .attr("data-focus-out", function (node) {
                    return node.focusOut;
                })
                .attr("r", config.graph.nodeRadius)
                .attr("cx", function(node) { return node.x; })
                .attr("cy", function(node) { return node.y; });

            env.parentDom
                .find('[data-toggle="popover"]')
                .popover({ container: 'body' });
        };

        this._drawPaths = function(){
            var path, paths, d3Data;

            cache.edges = $.map(this.edges, function(edge){
                return env.mainView.graph.getEdge(edge.start.getId(), edge.stop.getId());
            });

            paths = $.map(this.traceroutes, function(path){
                path.d = lineFunction(path.points);
                return path;
            });

            d3Data = env.mainView.pathsContainer
                .selectAll("path")
                .data(paths, function(path){
                    return path.id;
                })
                .on("mouseenter", function(path){
                    utils.observer.publish("view.traceroute:mousein", $this.traceroutes[path.id].model);
                })
                .on("mouseout", function(path){
                    utils.observer.publish("view.traceroute:mouseout", $this.traceroutes[path.id].model);
                })
                .on("mousedown", function(path){
                    utils.observer.publish("view.traceroute:click", $this.traceroutes[path.id].model);
                });

            d3Data
                .exit()
                .remove();

            d3Data
                .enter()
                .append("path");

            d3Data
                .attr("class", this._getPathClass)
                .attr("data-focus-out", this._isPathFocusOut)
                .transition()
                .attr("d", function(path){
                    return path.d;
                });
        };

        this._isNodeFocusOut = function (node) {
            if (currentSearch) {
                for (var n=0,length=node.traceroutes.length; n<length; n++){
                    if (currentSearch.in[node.traceroutes[n].id]){
                        return null;
                    }
                }
                return true;
            }

            return null;
        };

        this._isPathFocusOut = function (pathView) {
            if (currentSearch) {
                return ((!currentSearch.in[pathView.model.id])) ? true : null;
            }

            return null;
        };



        this._animatePathChange = function (oldTraceroute, newTraceroute) {
            var tracerouteId, element;

            tracerouteId = utils.getIdFromIp(oldTraceroute.source.getId() + '-' + oldTraceroute.target.getId());

            element = env.mainView.pathsContainer
                .select("path.path-" + tracerouteId);

            setTimeout(function(){
                element
                    .attr("data-animation", null);
            }, config.transitionsTimes.pathChange);

            element
                .attr("data-animation", true)
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