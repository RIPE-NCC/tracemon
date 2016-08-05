
define([
    "tracemon.lib.dagre",
    "tracemon.lib.jquery-amd"
], function(dagre, $){

    var DagreWrapper = function(env){
        var graph, dirty, $this;

        $this = this;
        dirty = true;
        this.nodesIndexed = {};
        this.edgesIndexed = {};
        this.edgesInIndexed = {};
        this.edgesOutIndexed = {};

        this.nodes = [];
        this.edges = [];

        this.width = 0;
        this.height = 0;
        this.mult = {x: 0, y: 0};
        this.margin = { top: 0, bottom: 0, left: 0, right: 0 };

        this.initGraph = function(width, height, options){
            this.width = width;
            this.height = height;

            this.margin.top = (options.margin && options.margin.top) ?  options.margin.top : this.margin.top;
            this.margin.bottom = (options.margin && options.margin.bottom) ?  options.margin.bottom : this.margin.bottom;
            this.margin.left = (options.margin && options.margin.left) ?  options.margin.left : this.margin.left;
            this.margin.right = (options.margin && options.margin.right) ?  options.margin.right : this.margin.right;

            graph = new dagre
                .graphlib
                .Graph({ multigraph: true })
                .setGraph({ "rankDir": "TB", "nodesep": 100, "ranksep": 50, "edgesep": 50 })
                .setDefaultEdgeLabel(function() { return {}; });
        };

        this.addNode = function(id, options){
            if (graph){
                graph.setNode(id, {
                    label: options.label,
                    class: options.class,
                    width: options.width,
                    height: options.height
                });
            } else {
                throw "The graph its not initialised"
            }

            dirty = true;
        };

        this.addEdge = function(node1, node2, options){
            if (graph){
                graph.setEdge(node1, node2, {
                    lineInterpolate: options.interpolation
                });

            } else {
                throw "The graph its not initialised"
            }

            dirty = true;
        };


        this.computeLayout = function(){
            var width, height;

            dagre.layout(graph);

            width = graph.graph().width;
            height = graph.graph().height;
            this.mult.x = ((this.width - (this.margin.right + this.margin.left)) / width);
            this.mult.y = ((this.height - (this.margin.bottom + this.margin.top)) / height);
        };


        this.getNode = function(id){
            this._updateStructure();
            return this.nodesIndexed[id];
        };


        this.getEdge = function(node1Id, node2Id){
            this._updateStructure();

            if (node1Id != null && node2Id != null) {
                return this.edgesIndexed[node1Id + '-' + node2Id];
            } else if (node1Id != null){
                return this.edgesOutIndexed[node1Id];
            } else {
                return this.edgesInIndexed[node2Id];
            }
        };

        this._updateStructure = function(){
            if (dirty){
                dirty = false;

                this.nodes = $.map(graph.nodes(), function(id){
                    var node = graph.node(id);
                    return {
                        id: id,
                        x: (node.x * $this.mult.x) + $this.margin.left,
                        y: (node.y * $this.mult.y) + $this.margin.top,
                        label: node.label,
                        class: node.class
                    }
                });

                this.edges = $.map(graph.edges(), function(id){
                    var edge, points, point;

                    edge = graph.edge(id);

                    points = [];

                    for (var n=0,length=edge.points.length; n<length; n++){
                        point = edge.points[n];
                        points.push({
                            x: (point.x * $this.mult.x) + $this.margin.left,
                            y: (point.y * $this.mult.y) + $this.margin.top
                        });
                    }

                    return {
                        id: id.v + '-' + id.w,
                        from: id.v,
                        to: id.w,
                        points: points,
                        start: {
                            x: (edge.x * $this.mult.x) + $this.margin.left,
                            y: (edge.y * $this.mult.y) + $this.margin.top
                        },
                        options: {
                            interpolation: edge.lineInterpolate
                        }
                    };
                });


                this.forEachNode(function(node){
                    $this.nodesIndexed[node.id] = node;
                });

                this.forEachEdge(function(edge){
                    $this.edgesIndexed[edge.id] = edge;

                    $this.edgesInIndexed[edge.to] = $this.edgesInIndexed[edge.to] || {};
                    $this.edgesOutIndexed[edge.from] = $this.edgesOutIndexed[edge.from] || {};
                    $this.edgesInIndexed[edge.to][edge.id] = edge;
                    $this.edgesOutIndexed[edge.from][edge.id] = edge;
                });

            }
        };

        this.getNodes = function(){
            this._updateStructure();
            return this.nodes;
        };

        this.getEdges = function(){
            this._updateStructure();
            return this.edges;
        };

        this.forEachNode = function(callback){
            var nodes = this.getNodes();
            for (var n=0,length=nodes.length; n<length; n++){
                callback(nodes[n]);
            }
        };

        this.forEachEdge = function(callback){
            var edges = this.getEdges();
            for (var n=0,length=edges.length; n<length; n++){
                callback(edges[n]);
            }
        };

    };


    return DagreWrapper;
});