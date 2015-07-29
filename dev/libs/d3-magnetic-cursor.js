/**
 * Copyright 2015 - mcandela
 * Date: 02/02/15
 * Time: 16:36
 */

define([
    "lib.d3"
], function(d3) {
    d3.magneticPaths = {
        closestPathPoint: function (pathNode, point) { // Thanks to http://bl.ocks.org/mbostock/8027637
            var pathLength, precision, best, bestLength, bestDistance, distance2;

            pathLength = pathNode.getTotalLength();
            precision = pathLength / pathNode.pathSegList.numberOfItems * .125;
            bestDistance = Infinity;

            distance2 = function(p){
                var dx, dy;

                dx = p.x - point[0];
                dy = p.y - point[1];

                return dx * dx + dy * dy;
            };

            // linear scan for coarse approximation
            for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
                scan = pathNode.getPointAtLength(scanLength);
                scanDistance = distance2(scan);
                if (scanDistance < bestDistance) {
                    best = scan;
                    bestLength = scanLength;
                    bestDistance = scanDistance;
                }
            }

            // binary search for precise estimate
            precision *= .5;
            while (precision > .5) {
                var before, after, beforeLength, afterLength, beforeDistance, afterDistance;

                if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
                    best = before;
                    bestLength = beforeLength;
                    bestDistance = beforeDistance;
                } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
                    best = after;
                    bestLength = afterLength;
                    bestDistance = afterDistance;
                } else {
                    precision *= .5;
                }
            }

            best = {
                x: best.x,
                y: best.y,
                distance: Math.sqrt(bestDistance)
            };

            return best;
        },


        closestPointPathsList: function (pathsList, point) {
            var smallestPoint, tmpPath, closestPath, tmpPoint;

            smallestPoint = null;
            //for (var n = 0, length = pathsList.length; n < length; n++) {

            for (var n in pathsList){
                tmpPath = pathsList[n];
                tmpPoint = this.closestPathPoint(tmpPath.node(), point);

                if (!smallestPoint || smallestPoint.distance > tmpPoint.distance) {
                    smallestPoint = tmpPoint;
                    closestPath = tmpPath;
                }
            }

            return {path: closestPath, point: smallestPoint};
        },


        attract: function (magneticDistance, pathsList, point) {
            var closestPoint;

            closestPoint = this.closestPointPathsList(pathsList, point);

            return (closestPoint.point.distance <= magneticDistance) ? closestPoint : null;
        }
    };

    return d3;
});
