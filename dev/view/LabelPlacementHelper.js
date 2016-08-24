
define([
    "tracemon.env.utils"
], function(utils){

    var LabelPlacementHelper = function(nodeWidth, nodeHeight, fontSizePixel){
        var height, checkedNodes, labelBoxes, minLabelWidth, nodeHalfWidth, nodeHalfHeight;

        minLabelWidth = 60;
        height = fontSizePixel + 5;

        checkedNodes = [];
        labelBoxes = [];

        nodeHalfWidth = nodeWidth /2;
        nodeHalfHeight = nodeHeight /2;


        this.setNodes = function(nodes){
            checkedNodes = nodes;
            labelBoxes = [];
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


        this._getRightBox = function(node, width){
            var vector, labelBox;

            labelBox = [
                {x: 0, y: 0},
                {x: width, y: 0},
                {x: width, y: height},
                {x: 0, y: height}
            ];

            vector = {
                x: (node.x + nodeHalfWidth),
                y: (node.y - (height/2 + nodeHalfHeight + 3))
            };

            return utils.translate(labelBox, vector);
        };


        this._getLeftBox = function(node, width){
            var vector, labelBox;

            labelBox = [
                {x: 0, y: 0},
                {x: width, y: 0},
                {x: width, y: height},
                {x: 0, y: height}
            ];

            vector = {
                x: (node.x - (nodeHalfWidth + width)),
                y: (node.y - (nodeHalfHeight - 3))
            };

            return utils.translate(labelBox, vector);
        };


        this._getTopBox = function(node, width){
            var vector, labelBox;

            labelBox = [
                {x: 0, y: 0},
                {x: width, y: 0},
                {x: width, y: height},
                {x: 0, y: height}
            ];

            vector = {
                x: (node.x - (width/2 - nodeHalfWidth/2)),
                y: (node.y - (nodeHalfHeight + height))
            };

            return utils.translate(labelBox, vector);
        };

        this._getBottomBox = function(node, width){
            var vector, labelBox;

            labelBox = [
                {x: 0, y: 0},
                {x: width, y: 0},
                {x: width, y: height},
                {x: 0, y: height}
            ];
            vector = {
                x: (node.x - (width/2)),
                y: (node.y + (nodeHalfHeight + height/2))
            };


            return utils.translate(labelBox, vector);
        };


        this.getLabelPosition = function(node, edges, label){
            var boxTop, boxLeft, boxRight, checkIntersectionLabel, boxBottom, checkIntersectionAmongBoxes, width;

            width = Math.max(label.length * (fontSizePixel/2), minLabelWidth);
            boxTop = this._getTopBox(node, width);
            boxLeft = this._getLeftBox(node, width);
            boxRight = this._getRightBox(node, width);
            boxBottom = this._getBottomBox(node, width);

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

            if (!checkIntersectionLabel(boxTop[3], boxTop[1], edges) && !checkIntersectionAmongBoxes(boxTop)){ // Is there an intersection if I place the label on top?
                labelBoxes.push(boxTop);
                return {
                    // alignment: "middle",

                    alignment: "start",
                    direction: "vertical",
                    x: boxTop[3].x + (width/2),
                    y: boxTop[3].y
                };
            }

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

            return {
                alignment: "middle",
                x: boxBottom[0].x + (width/2),
                y: boxBottom[0].y
            };
        };
    };


    return LabelPlacementHelper;
});