
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd"
], function(utils, config, lang, $, d3){

    var ASView = function(env){
        var $this, asColors, assignedColors;

        $this = this;
        this.nodes = {};
        this.edges = {};
        asColors = config.graph.asColors;
        assignedColors = {};

        this.draw = function(traceroutesToDraw, callback){
            this._computeLayout(this._computeMeshGraph());
            this.computeVisibleGraph(traceroutesToDraw);

            env.mainView.graph.computeLayout();

            this._drawEdges();
            this._drawNodes();

            // callback();
        };

        this._getAsColor = function(asObj){
            if (!assignedColors[asObj.id]) {
                assignedColors[asObj.id] = asColors.pop();
            }

            return assignedColors[asObj.id];
        };

        this.computeVisibleGraph = function(traceroutesToDraw){
            var traceroute, host, edgeKey, attempt, asObj, previousAS;

            for (var n=0,length=traceroutesToDraw.length; n<length; n++){
                traceroute = traceroutesToDraw[n];
                previousAS = traceroute.source.getAutonomousSystem();

                if (previousAS) {
                    $this.nodes[previousAS.id] = previousAS;
                }
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

            }
        };

        this._computeMeshGraph = function(){
            var traceroutes, traceroute, host, edgeKey, attempt, asObj, previousAS, nodes, edges;

            nodes = {};
            edges = {};

            traceroutes = $.map(env.main.loadedMeasurements, function(item){
                return item.getTraceroutes();
            });

            for (var n=0,length=traceroutes.length; n<length; n++){
                traceroute = traceroutes[n];
                previousAS = traceroute.source.getAutonomousSystem();

                if (previousAS) {
                    nodes[previousAS.id] = previousAS;
                }
                traceroute.forEachHop(function(hop){
                    attempt = hop.getMainAttempt();
                    host = attempt.host;

                    asObj = host.getAutonomousSystem();

                    if (asObj) {
                        nodes[asObj.id] = asObj;

                        if (previousAS && previousAS.id != asObj.id) {
                            edgeKey = previousAS.id + '-' + asObj.id;
                            edges[edgeKey] = [previousAS, asObj];
                        }

                        previousAS = asObj;
                    }
                });

            }

            return { nodes: nodes, edges: edges }
        };

        this._computeLayout = function(mesh){

            var nodeObj, edgeObj;

            for (var node in mesh.nodes) {
                nodeObj = mesh.nodes[node];
                env.mainView.graph.addNode(nodeObj.id, {
                    label: nodeObj.id,
                    class: "node-host-" + nodeObj.id,
                    width: config.graph.nodeRadius,
                    height: config.graph.nodeRadius
                });
            }

            for (var edge in mesh.edges) {
                edgeObj = mesh.edges[edge];
                env.mainView.graph.addEdge(edgeObj[0].id, edgeObj[1].id, {
                    interpolation: 'basis',
                    class: "edge-host"
                });
            }

            env.mainView.graph.computeLayout();
        };

        this._drawNodes = function(){
            var nodes;

            nodes = $.map(this.nodes, function(node){
                var nodeView = env.mainView.graph.getNode(node.id);
                nodeView.model = node;
                return nodeView;
            });

            d3.select("svg")
                .append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(nodes)
                .enter()
                .append("circle")
                .attr("class", this._getNodeClass)
                .attr("r", config.graph.nodeRadius)
                .attr("fill", this._getAsColor)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        };



        this._getNodeClass = function(nodeView){
            var classes, host;

            host = nodeView.model;
            classes = "node node-" + host.id + " ";
            // if (host.isIxp){
            //     classes += "ixp";
            // } else if (host.isProbe) {
            //     classes += "source";
            // } else if (host.isPrivate) {
            //     classes += "private";
            // } else if (host.isTarget) {
            //     classes += "target";
            // } else if (!host.ip) {
            //     classes += "null";
            // }

            return classes;
        };

        this._drawEdges = function(){
            var edges, edge, points;

            edges = $.map(this.edges, function(edge){
                return env.mainView.graph.getEdge(edge[0].id, edge[1].id);
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
                    .attr("class", "edge edge-" + edge.id)
                    .attr("d", lineFunction(points));
            }
        };
    };


    return ASView;
});