
define([
    "tracemon.lib.viz",
    "tracemon.lib.jquery-amd",
    "tracemon.env.utils"
], function(viz, $, utils){

    var GraphvizWrapper = function(env){
        var dirty, $this, imposedParams, plainNodes, plainEdges, internalIds, externalIds, sameRank;

        $this = this;
        imposedParams = {};
        plainNodes = {};
        plainEdges = {};
        internalIds = {}; // external: internal
        externalIds = {}; // internal: external
        sameRank = {}; // Nodes at the same rank


        this._getInternalId = function(external){
            return internalIds[external];
        };

        this._getExternalId = function(internal){
            return externalIds[internal];
        };

        this._generateInternalId = function (external) {
            var internalId;

            internalId = this._getInternalId(external);

            if (!internalId){
                internalId = Object.keys(internalIds).length;
                internalIds[external] = internalId;
                externalIds[internalId] = external;
            }

            return internalId;
        };

        this._setDefaults = function () {
            dirty = true;
            this.nodesIndexed = {};
            this.edgesIndexed = {};
            this.edgesInIndexed = {};
            this.edgesOutIndexed = {};

            this.nodes = [];
            this.edges = [];

            this.width = 0;
            this.height = 0;
            this.options = {};
            this.mult = {x: 1, y: 1};
            this.margin = { top: 0, bottom: 0, left: 0, right: 0 };
        };

        this._setDefaults();

        this._getDotNotation = function(){
            var out, edge, node, from, to;

            out = '' +
                'size="10";\n' +
                'ordering="out";\n' +
                'center="false";\n' +
                'splines= "false";\n' +
                'ratio=0.1;\n' +
                'ranksep="2";\n' +
                'nodesep="2";\n' +
                'node [label=""];\n' +
                // 'edge [weight=1.2];\n' +
                'rankdir="BT";\n' +
                '\n\n';

            for (var nodeKey in plainNodes){
                node = plainNodes[nodeKey];
                out += nodeKey + ' [id="' + nodeKey + '" label="' + this._getExternalId(nodeKey) + '"];\n';
            }

            for (var rankKey in sameRank){
                out += '{rank=same; ' + sameRank[rankKey].join(" ") + '}; \n';
            }

            for (var edgeKey in plainEdges){
                edge = plainEdges[edgeKey];
                from =this._getInternalId(edge.from);
                to = this._getInternalId(edge.to);
                if (plainNodes[from] && plainNodes[to]) {
                    out += from + ' -> ' + to + ' [id="' + edgeKey + '"]; \n';
                } else {
                    console.log("wtf");
                }
            }

            return "digraph G { " + out + " }";
        };

        this.initGraph = function(width, height, options){
            imposedParams = {
                width: width,
                height: height,
                options: options
            };

            this.width = width;
            this.height = height;
            this.options = options;

            this.margin.top = (options.margin && options.margin.top) ?  options.margin.top : this.margin.top;
            this.margin.bottom = (options.margin && options.margin.bottom) ?  options.margin.bottom : this.margin.bottom;
            this.margin.left = (options.margin && options.margin.left) ?  options.margin.left : this.margin.left;
            this.margin.right = (options.margin && options.margin.right) ?  options.margin.right : this.margin.right;

        };

        this.reset = function () {
            this._setDefaults();
            this.initGraph(imposedParams.width, imposedParams.height, imposedParams.options);
        };

        this.addNode = function(id, options){
            var internalId;

            try {
                internalId = this._generateInternalId(id);
            } catch(e){
                internalId = Object.keys(plainNodes).length;
            }


            if (!plainNodes[internalId]) {
                plainNodes[internalId] = {
                    id: id,
                    label: options.label,
                    width: options.width,
                    height: options.height
                };

                if (options.rank){
                    sameRank[options.rank] = sameRank[options.rank] || [];
                    sameRank[options.rank].push(internalId);
                }
            }

            dirty = true;
        };

        this.addEdge = function(node1, node2, options){
            var internalFrom, internalTo, internalKey;

            internalFrom = this._generateInternalId(node1);
            internalTo = this._generateInternalId(node2);
            internalKey = internalFrom + "-" + internalTo;

            if (!plainEdges[internalKey] && node1 != node2) {
                plainEdges[internalKey] = {
                    id: node1 + "-" + node2,
                    from: node1,
                    to: node2,
                    options: {
                        lineInterpolate: options.interpolation
                    }
                };
            }

            dirty = true;
        };

        this.computeLayout = function(){
            var layout, node, x, y, pos, nodeObj, width, height, maxX, maxY, edge, points, edgeObj;

            layout = Viz(this._getDotNotation(), { format: "json", engine: "dot", ordering: "out" });
            layout = JSON.parse(layout);
            maxX = -Infinity;
            maxY = -Infinity;

            for (var n=0,length=layout.objects.length;n<length;n++){
                node = layout.objects[n];
                if (node.id) {
                    pos = node.pos.split(",");
                    x = parseFloat(pos[0]);
                    y = parseFloat(pos[1]);
                    nodeObj = plainNodes[node.id];

                    maxX = Math.max(x, maxX);
                    maxY = Math.max(y, maxY);

                    nodeObj.x = x;
                    nodeObj.y = y;
                }
            }

            for (var n=0,length=layout.edges.length;n<length;n++){
                edge = layout.edges[n];

                if (edge.id) {
                    pos = edge.pos.split(" ");

                    points = $.map(pos, function (item) {
                        var xy = item.split(",");
                        xy = (xy.length == 3) ? [xy[1], xy[2]] : xy;
                        return {
                            x: parseFloat(xy[0]),
                            y: parseFloat(xy[1])
                        }
                    });

                    x = parseFloat(pos[0]);
                    y = parseFloat(pos[1]);

                    edgeObj = plainEdges[edge.id];

                    edgeObj.points = points;
                    edgeObj.start = {
                        x: edge.x,
                        y: edge.y
                    };
                }
            }

            width = maxX;
            height = maxY;
            this.mult.x = ((this.width - (this.margin.right + this.margin.left)) / width);
            this.mult.y = ((this.height - (this.margin.bottom + this.margin.top)) / height);

            this._updateStructure();
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
            var node, edge, points, point;

            if (dirty) {
                dirty = false;

                this.nodes = [];
                for (var nodeId in plainNodes) {
                    node = plainNodes[nodeId];
                    this.nodes.push({
                        id: node.id,
                        x: (node.x * $this.mult.x) + $this.margin.left,
                        y: (node.y * $this.mult.y) + $this.margin.top,
                        label: node.label
                    });
                }

                this.edges = [];
                for (var edgeId in plainEdges) {

                    edge = plainEdges[edgeId];
                    points = [];

                    if (edge.points) {
                        for (var n = 0, length = edge.points.length; n < length; n++) {
                            point = edge.points[n];
                            points.push({
                                x: (point.x * $this.mult.x) + $this.margin.left,
                                y: (point.y * $this.mult.y) + $this.margin.top
                            });
                        }
                    }

                    this.edges.push({
                        id: edge.id,
                        from: edge.from,
                        to: edge.to,
                        points: points,
                        start: {
                            x: (edge.x * $this.mult.x) + $this.margin.left,
                            y: (edge.y * $this.mult.y) + $this.margin.top
                        },
                        options: edge.options
                    });
                }

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


    return GraphvizWrapper;
});