/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(config, utils, $) {

    var HostClassificationHelper = function (env) {

        /**
         *
         * simplified traceroute format
         * [ { isNull: false, hosts: [host] }, { isNull: true, hosts: [*, *] }, { isNull: false, hosts: [host] }]
         */

        this.scanTraceroute = function (traceroute) {
            var hops, hop, attempts, attempt, element, next, sameHopIp, newHop, newTraceroute,
                toBeMerged, newHopKeys, previousHop, currentHop, nextHop;

            hops = traceroute.getHops();
            newTraceroute = [];
            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempts = hop.getAttempts();
                sameHopIp = null;

                newHop = [];
                newHopKeys = [];
                toBeMerged = false;
                for (var n1=0,length1=attempts.length; n1<length1; n1++){
                    attempt = attempts[n1];

                    if (attempt.host.ip == null || attempt.host.isPrivate){
                        toBeMerged = true;
                    }
                    if (newHopKeys.indexOf(attempt.host.ip) == -1 || toBeMerged) { //remove duplicate hops
                        newHopKeys.push(attempt.host.ip);
                        newHop.push(attempt.host);
                    }
                }

                newTraceroute.push({
                    toBeMerged: toBeMerged,
                    hosts: newHop
                });
            }

            for (var n=0,length=newTraceroute.length; n<length-1; n++){
                element = newTraceroute[n];
                next = newTraceroute[n+1];

                if (element.toBeMerged && next.toBeMerged) {
                    while (next && next.toBeMerged){
                        element.hosts = element.hosts.concat(next.hosts);
                        if (element != newTraceroute[n]){
                            newTraceroute[n] = null;
                        }
                        n++;
                        next = newTraceroute[n];
                    }

                    n--;
                }
            }

            newTraceroute = newTraceroute.filter(function(element){
                return element != null;
            });

            for (var n=0,length=newTraceroute.length; n<length-2; n++){
                previousHop = newTraceroute[n];
                currentHop = newTraceroute[n+1];
                nextHop = newTraceroute[n+2];

                if (currentHop.toBeMerged && previousHop.hosts.length == 1 && nextHop.hosts.length == 1) {

                    $.when.apply(this, [
                        previousHop.hosts[0].getAutonomousSystems(),
                        nextHop.hosts[0].getAutonomousSystems()
                    ]).done(function(as1, as2){

                        if (as1.length == 1 && as2.length == 1 && as1[0].id == as2[0].id){

                            for (var n1=0,length1=currentHop.hosts.length; n1<length1-1; n1++){
                                currentHop.hosts[n1]._autonomousSystems = [as1[0]];
                            }
                        }
                    });

                }
            }
        }

    };

    return HostClassificationHelper;

});

