
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment",
    "tracemon.lib.d3-amd",
    "tracemon.lib.parsePrefix",
    "tracemon.view.label-placement"
], function(utils, config, lang, $, moment, d3, prefixUtils, LabelPlacement){

    var SingleHostView = function(env){
        var $this, labelPlacement, cache, nodeBBox, currentSearch, lineFunction, cleanRedraw;

        $this = this;
        nodeBBox = (config.graph.nodeRadius * 2) + 5;
        labelPlacement = new LabelPlacement(nodeBBox, nodeBBox, 12);
        currentSearch = null;
        cache = {
            nodes: [],
            edges: []
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

        this._setListeners = function(){
            utils.observer.subscribe("view:probe-set", function () {
                cleanRedraw = true;
            });
            utils.observer.subscribe("model.host:ixp", this._updateIxp, this);
            utils.observer.subscribe("view.label-level:change", function () {
                for (var n=0,length=this.nodesArray.length; n<length; n++) {
                    $this._updateLabel($this.nodesArray[n].model);
                }
            }, this);

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
            where = labelPlacement.getLabelPosition(node, cache.edgePoints, node.label, config.graph.labelOrientationPreference);

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
                .append("text");

            labelsSvg
                .attr("class", this._getLabelClass)
                .attr("data-focus-out", function (node) {
                    return node.focusOut;
                })
                .attr("x", function(node){
                    return (config.graph.allowRotatedLabels && node.labelPosition.direction ==  "vertical") ?
                        (node.labelPosition.x + node.labelPosition.xOffset) :
                        node.labelPosition.x;
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
                    if (config.graph.allowRotatedLabels && node.labelPosition.direction ==  "vertical"){
                        return "rotate(-60," + (node.labelPosition.x + node.labelPosition.xOffset) + "," + node.labelPosition.y + ")";
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
                    .attr("class", this._getLabelClass)
                    .text(nodeView.label);
            } catch (e){
                console.log(host, nodeView);

                console.log(e);
            }
        };

        this._updateIxp = function(host){
            env.mainView.svg
                .select(".node-" + utils.getIdFromIp(host.getId()))
                .attr("class", this._getNodeClass);
            this._updateLabel(host);
        };

        this._getDefaultNodeLabel = function(host){

            if (host.isIxp){
                return host.ixp.name;
            } else if (host.isProbe) {
                return "Probe " + host.probeId + ((host.getAutonomousSystem()) ? " (AS" + host.getAutonomousSystem().id + ")" : "");
            } else if (host.ip == null){
                return "* " + ((host.getAutonomousSystem()) ? " (Guess: AS" + host.getAutonomousSystem().id + ")" : "");
            } else {
                return host.ip + ((host.getAutonomousSystem()) ? " (AS" + host.getAutonomousSystem().id + ")" : "");
            }
        };

        this.getNodeLabel = function (host){


            switch (env.labelLevel){
                case "geo":
                    if (host.getLocation() !== undefined){
                        return (host.getLocation()) ? host.getLocation().country : this._getDefaultNodeLabel(host);
                    } else {
                        env.connector
                            .getGeolocation(host)
                            .done(function(label){
                                try {
                                    $this._updateLabel(host);
                                }catch(e){
                                }
                            });
                        return "loading";
                    }

                    break;
                case "reverse-lookup":
                    if (host.reverseDns !== undefined){
                        return host.reverseDns || this._getDefaultNodeLabel(host);
                    } else {
                        env.connector
                            .getHostReverseDns(host)
                            .done(function(label){
                                try {
                                    $this._updateLabel(host);
                                }catch(e){
                                }
                            });
                        return "loading";
                    }
                    break;

                case "ip":
                    return this._getDefaultNodeLabel(host);
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

        this.draw = function(diff, callback) {
            var traceroutesToDraw;

            traceroutesToDraw = diff.newTraceroutes;

            this._computeLayout(this._computeMeshGraph());
            this.computeVisibleGraph(traceroutesToDraw);
            this._updateNodesGraphAttributes();
            this._drawPaths();
            this._drawNodes();

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

            currentSearch = env.headerController.updateSearch();
            this._computeLayout(this._computeMeshGraph()); // This should be done only if there are new events in the history
            this.computeVisibleGraph(diff.status);
            this._updateNodesGraphAttributes();

            for (var change in diff.updatedTraceroutes) {
                this._animatePathChange(diff.updatedTraceroutes[change]["before"], diff.updatedTraceroutes[change]["now"]);
            }

            this._drawPaths();
            this._drawNodes();

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
            }

            return { nodes: nodes, edges: edges };
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
            var hosts, nodesToUpdate, nodes, path, labels;

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

            labels = env.mainView.svg
                .selectAll(".node-label");

            labels
                .data(nodesToUpdate, function(element){
                    return element.id;
                })
                .attr("data-hover", ((hovered) ? true : null));

            this._showDirection(path, hovered);
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

        this._getPathClass = function (pathView) {
            return "path path-" + pathView.id;
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

        this._getLabelClass = function(node){
            var classOut;

            classOut = "node-label node-label-" + utils.getIdFromIp(node.id);

            if (node.model.isProbe){
                classOut += " probe";
            }

            if (node.model.isIxp){
                classOut += " ixp";
            }

            if (node.model.isTarget){
                classOut += " target";
            }

            if (node.model.isLast){
                classOut += " last";
            }

            return classOut;
        };

        this._calculateLabelsPosition = function () {
            for (var n=0,length=this.nodesArray.length; n<length; n++) {
                $this._calculateLabelPosition(this.nodesArray[n]);
            }
        };

        this._getPopoverContent = function (node) {
            var out, guess, asObj;

            out = "";
            guess = (node.model.isPrivate || !node.model.ip);
            out += (!node.model.ip && node.model.multiplicity > 1) ? "Repeated " + node.model.multiplicity + " times<br>" : "";
            out += (node.model.ip) ? "IP: " + node.model.ip + "<br>" : "";

            if (node.model.isIxp) {
                out += "IXP: " + node.model.ixp.name + ", " + node.model.ixp.city + ", " + node.model.ixp.country;
                out += "<br>Lan: " + node.model.ixp.prefix;
            }

            asObj = node.model.getAutonomousSystem();
            if (asObj) {
                out += "<br><b>" + ((guess) ? "Best guess:" : "Routing info:") + "</b><br>";
                out += "AS" + asObj.id + " - " + asObj.owner;
                out += "<br><br><b>Registry info:</b>";

                out += "<br> Announced: " + asObj.announced + "<br>";
                for (var extra in asObj.extra) {
                    out += extra.charAt(0).toUpperCase() + extra.slice(1) + ": " + asObj.extra[extra] + "<br>";
                }
            } else {
                out += "<br>No AS information available for this node";
            }

            return out;
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
                .attr("title", function(node){
                    return node.label;
                })
                .attr("data-content", this._getPopoverContent);

            nodesSvg
                .attr("class", this._getNodeClass)
                .attr("data-focus-out", function (node) {
                    return node.focusOut;
                })
                .attr("r", config.graph.nodeRadius)
                .attr("cx", function(node) { return node.x; })
                .attr("cy", function(node) { return node.y; });

        };

        this._drawPaths = function(){
            var path, paths, d3Data, edge, edgeView;

            for (var edgeKey in this.edges){
                edge = this.edges[edgeKey];
                edgeView = env.mainView.graph.getEdge(edge.start.getId(), edge.stop.getId());
                if (edgeView){
                    cache.edges.push(edgeView);
                }
            }

            paths = $.map(this.traceroutes, function(path){
                path.d = lineFunction(path.points);
                return path;
            });

            d3Data = env.mainView.pathsContainer
                .selectAll("path")
                .data(paths, function(path){
                    return path.id;
                });

            d3Data
                .exit()
                .transition()
                .duration(function(){
                    return $this._getAnimationTransitionTime("pathRemoval");
                })
                .style("opacity", 0.1)
                .each("end", function(){
                    d3.select(this).remove();
                });

            d3Data
                .enter()
                .append("path")
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