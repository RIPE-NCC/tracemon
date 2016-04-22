/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils"
], function(config, utils) {

    var AsnNeighboursHelper = function (env) {
        /**
         * Example
         * before: 4544
         * after: 3333
         * possibleAsn: [1234, 5678]
         * neighbours: [{asn: 3333, score: 80}, {asn: 3235, score: 40}, {asn: 4544, score: 2}] neighbours of possibleAsn
         */

        this.whichMorePossible = function (before, after, possibleAsn, neighbours) {
            var filteredNeighbours, answer;

            if (!neighbours){ // No answer from the neighbours database

                console.log("no guesses possible for " + possibleAsn);
                answer = possibleAsn[0]; //  Return the first one

            } else { // There is an answer from the neighbours database

                filteredNeighbours = neighbours.filter(function (item) { // Filter the answer
                    return item.asn == before || item.asn == after;
                });

                if (filteredNeighbours.length == 0) { // No matches in the answer

                    console.log("no guesses possible for " + possibleAsn);
                    answer = possibleAsn[0]; //  Return the first one

                } else { // We got some matches

                    filteredNeighbours.sort(function(item1, item2){
                        return item1.score - item2.score;
                    });

                    answer = filteredNeighbours[0].asn;

                }

            }

            return answer;
        }

    };

    return AsnNeighboursHelper;

});

