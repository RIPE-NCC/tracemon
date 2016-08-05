
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.lib.jquery-amd"
], function(utils, config, $){

    var LabelPlacementHelper = function(env){
        var labelBox, height, width, nodeHalfWidth, nodeHalfHeight, halfScreen, checkedNodes, labelBoxes;

        width = 120;
        height = 12;

        labelBox = [
            {x: 0, y: 0},
            {x: width, y: 0},
            {x: width, y: height},
            {x: 0, y: height}
        ];

        nodeHalfWidth = 15;
        nodeHalfHeight = 20;

        halfScreen = 750;

        checkedNodes = [];
        labelBoxes = [];

        this.setNodes = function(nodes){
            checkedNodes = nodes;
        };

        this._isNodeIntersection = function(node, box){
            var nodeTmp;

            for (var n=0,length=checkedNodes.length; n<length; n++){
                nodeTmp = checkedNodes[n];

                if (nodeTmp.id != node.id &&
                    utils.getLinesIntersection(
                        {x: nodeTmp.x, y: nodeTmp.y + nodeHalfHeight},
                        {x: nodeTmp.x, y: nodeTmp.y - nodeHalfHeight},
                        {x: box[0].x, y: box[0].y + height},
                        {x: box[1].x, y: box[0].y + height}
                    )){
                    return true;
                }
            }

            return false;
        };


        this._getRightBox = function(node){
            var vector;

            vector = {
                x: (node.x + nodeHalfWidth),
                y: (node.y - (height/2 + nodeHalfHeight + 3))
            };

            return utils.translate(labelBox, vector);
        };


        this._getLeftBox = function(node){
            var vector;

            vector = {
                x: (node.x - (nodeHalfWidth + width)),
                y: (node.y - (nodeHalfHeight - 3))
            };

            return utils.translate(labelBox, vector);
        };


        this._getTopBox = function(node){
            var vector;

            vector = {
                x: (node.x - (width/2)),
                y: (node.y - (nodeHalfHeight + height))
            };


            return utils.translate(labelBox, vector);
        };

        this._getBottomBox = function(node){
            var vector;

            vector = {
                x: (node.x - (width/2)),
                y: (node.y + (nodeHalfHeight))
            };


            return utils.translate(labelBox, vector);
        };


        this.getLabelPosition = function(node, edges){
            var boxTop, boxLeft, boxRight, checkIntersectionLabel, boxBottom, checkIntersectionAmongBoxes;

            boxTop = this._getTopBox(node);
            boxLeft = this._getLeftBox(node);
            boxRight = this._getRightBox(node);
            boxBottom = this._getBottomBox(node);

            checkIntersectionLabel = function(sidePoint1, sidePoint2, edges){
                var intersection, edge;

                intersection = false;
                for (var n=0,length=edges.length; n<length; n++){
                    edge = edges[n];

                    for (var i=0,lengthi=edge.length-1; i<lengthi; i++){

                        if (utils.getLinesIntersection(sidePoint1, sidePoint2, edge[i], edge[i+1])) {
                            return true;
                        }
                    }
                    if (intersection){
                        return true;
                    }
                }

                return false;
            };

            checkIntersectionAmongBoxes = function(box){
                return labelBoxes.some(function(boxItem){
                    return utils.isThereAnIntersection(box, boxItem);
                });
            };

            if (!checkIntersectionLabel(boxTop[3], boxTop[2], edges) && !checkIntersectionAmongBoxes(boxTop)){ // Is there an intersection if I place the label on top?
                labelBoxes.push(boxTop);
                return {
                    alignment: "start",
                    writingMode: "tb",
                    direction: "vertical",
                    x: boxTop[3].x + (width/2),
                    y: boxTop[3].y
                };
            }

            // if (node.x > halfScreen){

            if (!checkIntersectionLabel(boxRight[0], boxRight[1], edges) &&
                !this._isNodeIntersection(node, boxRight)  &&
                !checkIntersectionAmongBoxes(boxRight)){
                labelBoxes.push(boxRight);

                return {
                    alignment: "start",
                    x: boxRight[0].x,
                    y: boxRight[0].y + (height + nodeHalfHeight)
                };
            }


            if (!checkIntersectionLabel(boxLeft[0], boxLeft[1], edges) &&
                !this._isNodeIntersection(node, boxLeft)
                && !checkIntersectionAmongBoxes(boxLeft)){

                labelBoxes.push(boxLeft);

                return {
                    alignment: "end",
                    x: boxLeft[1].x,
                    y: boxLeft[1].y + (nodeHalfHeight)
                };
            }

            // } else {
            //     if (!checkIntersectionLabel(boxLeft[2], boxLeft[3], edges) && !this._isNodeIntersection(node, boxLeft)){
            //         return {
            //             alignment: "end",
            //             x: boxLeft[1].x,
            //             y: boxLeft[1].y + (nodeHalfHeight)
            //         };
            //     }
            //
            //     if (!checkIntersectionLabel(boxRight[2], boxRight[3], edges) && !this._isNodeIntersection(node, boxRight)){
            //         return {
            //             alignment: "start",
            //             x: boxRight[0].x,
            //             y: boxRight[0].y + (height + nodeHalfHeight)
            //         };
            //     }
            // }

            return {
                alignment: "middle",
                x: boxBottom[0].x + (width/2),
                y: boxBottom[0].y
            };
        };
    };


    return LabelPlacementHelper;
});