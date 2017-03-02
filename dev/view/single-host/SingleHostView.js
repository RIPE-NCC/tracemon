
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment",
    "tracemon.lib.d3-amd",
    "tracemon.lib.parsePrefix",
    "tracemon.view.label-placement",
    "tracemon.view.single-host.path-view",
    "tracemon.view.single-host.node-view"
], function(utils, config, lang, $, moment, d3, prefixUtils, LabelPlacement, PathView, NodeView){

    var SingleHostView = function(env){
        var $this, labelPlacement, cache, nodeBBox, lineFunction, cleanRedraw;

        $this = this;
        nodeBBox = (config.graph.nodeRadius * 2) + 5;
        labelPlacement = new LabelPlacement(nodeBBox, nodeBBox, 12);
        cache = {
            nodes: [],
            edges: [],
            paths: {}
        };
        cleanRedraw = false;
        lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate(config.graph.pathInterpolation);

        this.nodes = {};
        this.nodesArray = [];
        this.edges = {};
        this.traceroutes = {};
        this.hoveredObject = null;

        this._setListeners = function(){
            utils.observer.subscribe("view:probe-set", function () {
                cleanRedraw = true;
            });
            utils.observer.subscribe("model.host:change", function(host){
                this._drawLabels({
                    nodes: [$this.nodes[host.getId()]]
                });
            }, this);

            utils.observer.subscribe("model.as:change", function(asObj){
                this._drawLabels({
                    nodes: $.map(asObj.getHosts(),function(host){
                        return $this.nodes[host.getId()];
                    })
                });
            }, this);
            utils.observer.subscribe("view.label-level:change", this._drawLabels, this);
            utils.observer.subscribe("view.traceroute:mousein", function(traceroute){
                this.dryUpdate();
                this._showDirection(traceroute, true);
            }, this);
            utils.observer.subscribe("view.traceroute:mouseout", function(traceroute){
                this.dryUpdate();
                this._showDirection(traceroute, false);
            }, this);
            utils.observer.subscribe("view.traceroute.search:new", this.dryUpdate, this);
            utils.observer.subscribe("view.traceroute.search:change", this.dryUpdate, this);
        };

        this._calculateLabelPosition = function(labelView){
            var position;

            if (!cache.edgePoints) {
                cache.edgePoints = $.map(cache.edges, function (nodeView) {
                    return [nodeView.points];
                });
            }
            position = labelPlacement.getLabelPosition(labelView.node, cache.edgePoints, labelView.getDynamicText(), config.graph.labelOrientationPreference);
            labelView.x = position.x;
            labelView.y = position.y;
            labelView.alignment = position.alignment;
            labelView.offset = position.offset;
        };

        this._drawLabels = function(externalOption){
            var labelsSvg, labels, nodes, options;

            labels = [];
            options = externalOption || {};
            nodes = options.nodes || this.nodesArray;

            for (var n=0,length=nodes.length; n<length; n++) {
                labels.push(nodes[n].label);
            }

            labelsSvg = env.mainView.svg
                .selectAll("text.node-label")
                .data(labels, function(labelView){
                    return labelView.id;
                });

            if (!options.nodes) {
                labelsSvg
                    .exit()
                    .remove();
            }

            labelsSvg
                .enter()
                .append("text");

            labelsSvg
                .attr("class", function(labelView){
                    return labelView.getClass();
                })
                .attr("data-hover", function(labelView){
                    return (labelView.isHovered()) ? true : null;
                })
                .attr("data-selected", function(labelView){
                    return (labelView.isSelected()) ? true : null;
                })
                .attr("data-focus-out", function (labelView) {
                    return (labelView.isFocusOut()) ? true : null;
                })
                .attr("data-hidden", function (labelView) {
                    return (!labelView.isVisible()) ? true : null;
                })
                .attr("x", function(labelView){
                    return labelView.x;
                })
                .attr("y", function(labelView){
                    return labelView.y;
                })
                .text(function(labelView){
                    return labelView.getDynamicText();
                })
                .style("text-anchor", function(labelView){
                    return labelView.alignment;
                });
        };

        this.dryUpdate = function () {
            console.log("dry update");
            this._updateNodesGraphAttributes();
            this._drawPaths();
            this._drawNodes();
            this._calculateLabelsPosition();
            this._drawLabels();

        };

        this._createNodeView = function(host, pathView){
            var nodeKey, nodeObj;

            nodeKey = host.getId();
            if (!this.nodes[nodeKey]) { // The node exists already
                nodeObj = new NodeView(env, host);
                this.nodes[nodeKey] = nodeObj;
                this.nodesArray.push(nodeObj);
            }

            this.nodes[nodeKey].traceroutes.push(pathView);

            return nodeObj;
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
            var patView;

            patView = new PathView(env, traceroute, this._getPointsFromTraceroute(traceroute));
            this.traceroutes[patView.id] = patView;

            return patView;
        };

        this.computeVisibleGraph = function(traceroutesToDraw){
            var traceroute, host, attempt, lastHost, pathView;

            this.nodes = {};
            this.nodesArray = [];
            this.edges = {};
            this.traceroutes = {};

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){

                traceroute = traceroutesToDraw[n];
                lastHost = traceroute.source;

                pathView = this._createPathView(traceroute);
                this._createNodeView(lastHost, pathView);


                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;
                    $this._createNodeView(host, pathView);

                    if (lastHost){
                        $this._createEdgeView(lastHost, host, traceroute);
                    }

                    lastHost = host;
                });

                if (config.graph.showTargetNodeIfNotReached && !traceroute.reachesTarget()){
                    lastHost = traceroute.getReachedHost();
                    $this._createNodeView(traceroute.target, pathView);

                    if (lastHost){
                        $this._createEdgeView(lastHost, traceroute.target, traceroute);
                    }
                }

            }

            labelPlacement.setNodes(this.nodesArray);
        };

        this._updateNodesGraphAttributes = function(){
            for (var n=0,length=this.nodesArray.length; n<length; n++){
                this.nodesArray[n].update();
            }
        };

        this.draw = function(diff, callback) {
            var traceroutesToDraw;

            traceroutesToDraw = diff.newTraceroutes;

            this._computeLayout(this._computeMeshGraph());
            this.computeVisibleGraph(traceroutesToDraw);

            this.dryUpdate();

            env.parentDom.popover({
                container: env.parentDom,
                trigger: 'click,focus',
                selector: '[data-toggle="popover"]'
            });

            if (callback){
                callback();
            }
        };

        this.update = function(diff, callback){

            env.headerController.updateSearch();
            this._computeLayout(this._computeMeshGraph()); // This should be done only if there are new events in the history
            this.computeVisibleGraph(diff.status);
            // this._updateNodesGraphAttributes(); Can it be removed?

            for (var change in diff.updatedTraceroutes) {
                this._animatePathChange(diff.updatedTraceroutes[change]["before"], diff.updatedTraceroutes[change]["now"]);
            }

            this.dryUpdate();

            if (callback) {
                callback();
            }
        };

        this._computeMeshGraph = function(){
            var traceroutes, traceroute, edges, nodes, previousHost, sourcesUsed, tracerouteLength,
                globalLongestTraceroute, previousHostId, hosts;

            nodes = {};
            edges = {};
            sourcesUsed = {};

            traceroutes = [];

            globalLongestTraceroute = env.metaData.longestTraceroute;
            for (var msmId in env.loadedMeasurements){
                var measurement = env.loadedMeasurements[msmId];
                traceroutes = traceroutes.concat(measurement.getTraceroutes());
            }

            traceroutes = traceroutes.sort(function(a, b){return b.date.diff(a.date);}); // reversed

            for (var t=0,length = traceroutes.length; t<length; t++) {
                traceroute = traceroutes[t];
                tracerouteLength = traceroute.getLength();
                hosts = traceroute.getHostList();

                nodes[hosts[0].getId()] = hosts[0];

                for (var n=1,lengthn=hosts.length; n<lengthn; n++){
                    var edgeKey, hostId, host;

                    host = hosts[n];
                    previousHost = hosts[n - 1];
                    previousHostId = previousHost.getId();
                    hostId = host.getId();

                    if (previousHostId != hostId) { // No cycles on the same node

                        edgeKey = previousHostId + "-" + hostId;
                        nodes[hostId] = host;

                        if (!edges[edgeKey]){
                            if (!config.graph.removeCycle || !sourcesUsed[previousHostId]) {
                                sourcesUsed[previousHostId] = true;
                                edges[edgeKey] = {
                                    from: previousHost,
                                    to: host,
                                    weight: (globalLongestTraceroute.id == traceroute.id) ? 4 : 1
                                };
                            }
                        }

                    }

                }

                if (config.graph.showTargetNodeIfNotReached && !traceroute.reachesTarget()){ // add the disconnected target

                    previousHost = traceroute.getReachedHost();
                    host = traceroute.target;
                    hostId = host.getId();

                    edgeKey = previousHost.getId() + "-" + hostId;
                    nodes[hostId] = host;

                    if (!edges[edgeKey]) {
                        edges[edgeKey] = {
                            from: previousHost,
                            to: host,
                            weight: 8
                        };
                    }
                }
            }

            return { nodes: nodes, edges: edges };
        };

        this._showDirection = function (traceroute, hovered) {
            var marker, path;

            env.mainView.svg
                .selectAll(".dot.direction")
                .remove();

            if (hovered) {
                path = env.mainView.pathsContainer
                    .select(this.traceroutes[utils.getIdFromIp(traceroute.stateKey)].getClass(true));

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
                    .attrTween("transform", translateAlong(path.node()))
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

        this._computeLayout = function(mesh){
            var nodeObj, edgeObj;

            env.mainView.graph.reset();

            for (var node in mesh.nodes) {
                nodeObj = mesh.nodes[node];
                env.mainView.graph.addNode(nodeObj.getId(), {
                    width: config.graph.nodeRadius,
                    height: config.graph.nodeRadius,
                    rank: (nodeObj.isProbe) ? "first" : false
                });
            }

            for (var edge in mesh.edges) {
                edgeObj = mesh.edges[edge];
                env.mainView.graph.addEdge(edgeObj.from.getId(), edgeObj.to.getId(), {
                    interpolation: 'basis',
                    class: "edge-host",
                    weight: edgeObj.weight
                });
            }

            env.mainView.graph.computeLayout();
        };

        this._calculateLabelsPosition = function () {
            for (var n=0,length=this.nodesArray.length; n<length; n++) {
                this._calculateLabelPosition(this.nodesArray[n].label);
            }
        };

        this._drawNodes = function(){
            var nodesSvg;

            nodesSvg = env.mainView.nodesContainer
                .selectAll("circle")
                .data($this.nodesArray, function(nodeView){
                    return nodeView.id;
                });

            nodesSvg
                .exit()
                .transition()
                .duration(function(){
                    return $this._getAnimationTransitionTime("nodeRemoval");
                })
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
                .attr("data-trigger", "focus")
                .attr("tabindex", "0")
                .attr("data-html", "true")
                .attr("title", function(nodeView){
                    return nodeView.label.getText();
                })
                .attr("data-content", function (nodeView) {
                    return nodeView.getInfo();
                })
                .on("mouseenter", function(nodeView){
                    nodeView.isHovered(true);
                    $this.hoveredObject = nodeView;
                    $this.dryUpdate();
                    utils.observer.publish("view.host:mousein", nodeView.model);
                })
                .on("mouseout", function(nodeView){
                    nodeView.isHovered(false);
                    $this.hoveredObject = null;
                    $this.dryUpdate();
                    utils.observer.publish("view.host:mouseout", nodeView.model);
                });

            nodesSvg
                .attr("class", function(nodeView){
                    return nodeView.getClass();
                })
                .attr("data-focus-out", function (nodeView) {
                    return (nodeView.isFocusOut()) ? true : null;
                })
                .attr("data-hover", function(nodeView){
                    return (nodeView.isHovered()) ? true : null;
                })
                .attr("data-selected", function(nodeView){
                    return (nodeView.isSelected()) ? true : null;
                })
                .attr("r", function(nodeView){
                    return nodeView.getRadius();
                })
                .attr("cx", function(nodeView) {
                    return nodeView.x;
                })
                .attr("cy", function(nodeView) {
                    return nodeView.y;
                });

        };

        this._filterChangedPaths = function (pathView) {
            return (cache.paths[pathView.id]) ? pathView.equalsTo(cache.paths[pathView.id]) : true;
        };

        this._drawPaths = function(options){
            var path, paths, d3Paths, edge, edgeView, traceroutes, pathItem;
            var options = options || {};
            paths = [];

            traceroutes = options.traceroutes || this.traceroutes;

            for (var edgeKey in this.edges){
                edge = this.edges[edgeKey];
                edgeView = env.mainView.graph.getEdge(edge.start.getId(), edge.stop.getId());
                if (edgeView){
                    cache.edges.push(edgeView);
                }
            }

            for (var tracerouteKey in traceroutes){
                pathItem = traceroutes[tracerouteKey];
                paths.push(pathItem);
            }

            d3Paths = env.mainView.pathsContainer
                .selectAll("path")
                .data(paths.filter(this._filterChangedPaths), function(path){
                    return path.id;
                });

            d3Paths
                .exit()
                .transition()
                .duration(function(){
                    return $this._getAnimationTransitionTime("pathRemoval");
                })
                .style("opacity", 0.1)
                .each("end", function(){
                    d3.select(this).remove();
                });

            d3Paths
                .enter()
                .append("path")
                .on("mouseenter", function(pathView){
                    if (!pathView.isFocusOut()) {
                        $this.hoveredObject = pathView;
                        pathView.isHovered(true);
                        utils.observer.publish("view.traceroute:mousein", pathView.model);
                    }
                })
                .on("mouseout", function(pathView){
                    if (!pathView.isFocusOut()) {
                        $this.hoveredObject = null;
                        pathView.isHovered(false);
                        utils.observer.publish("view.traceroute:mouseout", pathView.model);
                    }
                })
                .on("mousedown", function(pathView){
                    if (!pathView.isFocusOut()) {
                        utils.observer.publish("view.traceroute:click", pathView.model);
                    }
                });

            d3Paths
                .attr("class", function(pathView){
                    return pathView.getClass();
                })
                .attr("data-hover", function(pathView){
                    return (pathView.isHovered()) ? true : null;
                })
                .attr("data-selected", function(pathView){
                    return (pathView.isSelected()) ? true : null;
                })
                .attr("data-focus-out", function(pathView){
                    return (pathView.isFocusOut()) ? true : null;
                })
                .transition()
                .attr("d", function(pathView){
                    return lineFunction(pathView.points);
                });
        };

        this._animatePathChange = function (oldTraceroute, newTraceroute) {
            var tracerouteId, element;

            tracerouteId = utils.getIdFromIp(oldTraceroute.stateKey);

            element = env.mainView.pathsContainer
                .select("path.path-" + tracerouteId);

            setTimeout(function(){
                element
                    .attr("data-animation", null);
            }, $this._getAnimationTransitionTime("pathChange"));

            element
                .attr("data-animation", true)
                .transition()
                .duration(function(){
                    return $this._getAnimationTransitionTime("pathChange");
                })
                .ease("linear")
                .attr("d", lineFunction(this._getPointsFromTraceroute(newTraceroute)));

        };

        this._getAnimationTransitionTime = function(type){
            var speed, emulationSpeedPercentage;

            emulationSpeedPercentage = env.historyManager.getEmulationSpeed() * 0.8;
            switch (type){
                case "pathChange":
                    speed = config.transitionsTimes.pathChange;
                    break;

                case "pathRemoval":
                    speed = config.transitionsTimes.pathRemoval;
                    break;

                case "nodeRemoval":
                    speed = config.transitionsTimes.nodeRemoval;
                    break;

                default:
                    throw "It was not possible to establish the animation transition time";

            }

            return Math.min(speed, emulationSpeedPercentage);
        };

        this._getPointsFromTraceroute = function(traceroute){
            var edge, points, pathId, unifiedPathArray, hosts, edgeTmp;

            unifiedPathArray = [];
            hosts = traceroute.getHostList();

            // hosts.push(traceroute.target);

            for (var n=0,length=hosts.length; n<length-1; n++){
                if (hosts[n].getId() != hosts[n + 1].getId()) {
                    edgeTmp = env.mainView.graph.getEdge(hosts[n].getId(), hosts[n + 1].getId());

                    if (edgeTmp){
                        unifiedPathArray.push(edgeTmp);
                    } else {
                        unifiedPathArray.push({ // Virtual edge
                            from: hosts[n].getId(),
                            to: hosts[n + 1].getId(),
                            points: [],
                            id: hosts[n].getId() + "-" + hosts[n + 1].getId()
                        });

                    }
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