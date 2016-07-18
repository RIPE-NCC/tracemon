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
        var uniqueHostAs;

        uniqueHostAs = {};



        this._cutHopsLength = function (traceroute, length) {
            var hops;

            hops = traceroute.getHops();
            traceroute._hops = hops.slice(Math.max(hops.length - length, 0));
        };

        this._categorizePrivateAndNull = function (traceroute) {
            var hops, hop, attempt, host, previousHop, previousAttempt, previousHost, nextHost,
                nextAttempt, nextHop, nextHostAS, previousHostAS;

            hops = traceroute.getHops();

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (n != 0 && n != hops.length - 1) {

                    if (!host.getAutonomousSystem()){
                        previousHop = hops[n - 1];
                        previousAttempt = previousHop.getMainAttempt();
                        previousHost = previousAttempt.host;
                        previousHostAS = previousHost.getAutonomousSystem();

                        if (previousHostAS){
                            for (var n2=n,length2=hops.length; n2<length2; n2++) {
                                nextHop = hops[n2];
                                nextAttempt = nextHop.getMainAttempt();
                                nextHost = nextAttempt.host;
                                nextHostAS = nextHost.getAutonomousSystem();

                                if (nextHostAS && (nextHostAS.id == previousHostAS.id)){
                                    host.setAutonomousSystem(nextHostAS);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        };

        this._removeMultipleNull = function (traceroute) {
            var hops, hop, attempt, host, previousHop, previousAttempt, previousHost, newHops;

            hops = traceroute.getHops();
            newHops = [];

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (n > 0 && !host.ip){
                    previousHop = hops[n-1];
                    previousAttempt = previousHop.getMainAttempt();
                    previousHost = previousAttempt.host;
                    if (!previousHost.ip) {
                        previousHost.multiplicity++;
                    } else {
                        newHops.push(hop);
                    }
                } else {
                    newHops.push(hop);
                }
            }

            traceroute._hops = newHops;
        };


        this.combinePrivateNodes = function(traceroute){
            var hops, attempt, host, hostKey, hop;

            hops = traceroute.getHops();

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (host.getAutonomousSystem() && host.isPrivate) {

                    hostKey = host.ip + "-" + host.getAutonomousSystem().id;

                    if (uniqueHostAs[hostKey] && (uniqueHostAs[hostKey] != attempt.host)){ // Check if the same object instance
                        attempt.host = uniqueHostAs[hostKey]; // Reuse the same Host object
                    }

                    uniqueHostAs[hostKey] = host;
                }
            }

        };


        this.scanTraceroute = function (traceroute) {
            this._categorizePrivateAndNull(traceroute);
            this._removeMultipleNull(traceroute);
            this.combinePrivateNodes(traceroute);
            this._cutHopsLength(traceroute, 15);
        }

    };

    return HostClassificationHelper;

});

