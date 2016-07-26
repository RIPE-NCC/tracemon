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
        var uniqueHostAs, bucketAses, asInOut, globalUniqueIn, globalUniqueOut, lastNullHop;

        uniqueHostAs = {};
        bucketAses = {};
        globalUniqueIn = {};
        globalUniqueOut = {};
        asInOut = {};

        this._cutHopsLength = function (traceroute, length) {
            var hops;

            hops = traceroute.getHops();
            traceroute._hops = hops.slice(Math.max(hops.length - length, 0));
        };

        this._categorizePrivateAndNull = function (traceroute) {
            var hops, hop, attempt, host, previousHop, previousAttempt, previousHost, nextHost,
                nextAttempt, nextHop, nextHostAS, previousHostAS;

            hops = traceroute.getHops();
            previousHost = traceroute.source;

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (n != hops.length - 1) {

                    if (!host.getAutonomousSystem()) {
                        if (n != 0) {
                            previousHop = hops[n - 1];
                            previousAttempt = previousHop.getMainAttempt();
                            previousHost = previousAttempt.host;
                        }
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


        this._combinePrivateAndNullNodes = function(traceroute){
            var hops, attempt, host, hostKey, hop;

            hops = traceroute.getHops();

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (host.getAutonomousSystem() && (host.isPrivate || !host.ip)) {
                    hostKey = (host.ip || "*") + "-" + host.getAutonomousSystem().id;
                    if (uniqueHostAs[hostKey] && (uniqueHostAs[hostKey] != attempt.host)){ // Check if the same object instance
                        attempt.host = uniqueHostAs[hostKey]; // Reuse the same Host object
                    } else {
                        uniqueHostAs[hostKey] = host;
                    }
                }
            }

        };


        this._preClassifyNullNodes = function(traceroute){
            var hops, attempt, host, hop, previousHop, nextHop, previousHost, previousAs, bucketKey,
                nextHost, nextAs;

            hops = traceroute.getHops();

            previousHost = traceroute.source;

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (!host.ip && !host.getAutonomousSystem()) {

                    // Create a structure to calculate how many * exit or enter from each AS
                    if (previousHost || n > 0) {
                        if (!previousHost) {
                            previousHop = hops[n - 1];
                            previousHost = previousHop.getMainAttempt().host;
                        }
                        previousAs = previousHost.getAutonomousSystem();
                        if (previousAs) {
                            bucketKey = previousAs.id.toString() + "-";
                            bucketAses[bucketKey] = bucketAses[bucketKey] || 0;
                            bucketAses[bucketKey]++;
                        }

                    }

                    if (n < hops.length - 1) {
                        nextHop = hops[n + 1];
                        nextHost = nextHop.getMainAttempt().host;
                        nextAs = nextHost.getAutonomousSystem();
                        if (nextAs) {
                            bucketKey = "-" + nextAs.id.toString();
                            bucketAses[bucketKey] = bucketAses[bucketKey] || 0;
                            bucketAses[bucketKey]++;
                        }
                    }

                }

                previousHost = null;

            }
        };

        this.scanTraceroute = function (traceroute) {
            this._categorizePrivateAndNull(traceroute);
            this._removeMultipleNull(traceroute);

            this._preClassifyNullNodes(traceroute);
            this._combinePrivateAndNullNodes(traceroute);
        };

        this._classifyNullNodes = function(traceroute){
            var hops, attempt, host, hop, previousHop, nextHop, previousHost, previousAs, bucketKey1, bucketKey2,
                nextHost, nextAs, bestBucket;

            hops = traceroute.getHops();
            previousHost = traceroute.source;

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];
                attempt = hop.getMainAttempt();
                host = attempt.host;

                if (!host.ip && !host.getAutonomousSystem()) {

                    if (!previousHop) {
                        previousHop = hops[n - 1];
                        previousHost = previousHop.getMainAttempt().host;
                    }
                    previousAs = previousHost.getAutonomousSystem();

                    if (n < hops.length - 1) {
                        nextHop = hops[n + 1];
                        nextHost = nextHop.getMainAttempt().host;
                        nextAs = nextHost.getAutonomousSystem();
                    }

                    if (n == hops.length -1){
                        if (lastNullHop) {
                            attempt.host = lastNullHop;
                        } else {
                            lastNullHop = host;

                        }
                    }

                    if (previousAs && nextAs) {
                        bucketKey1 = previousAs.id.toString() + "-";
                        bucketKey2 = "-" + nextAs.id.toString();
                        if (bucketAses[bucketKey1] > bucketAses[bucketKey2]){
                            host.setAutonomousSystem(previousAs);
                        } else if (bucketAses[bucketKey1] < bucketAses[bucketKey2]){
                            host.setAutonomousSystem(nextAs);
                        } else {
                            if (bucketAses[bucketKey1] == globalUniqueOut[previousAs.id]) {
                                host.setAutonomousSystem(previousAs);
                            } else if (bucketAses[bucketKey2] == globalUniqueOut[nextAs.id]) {
                                host.setAutonomousSystem(nextAs);
                            } else {
                                bestBucket = Math.min(
                                    Math.max(bucketAses[bucketKey1], globalUniqueIn[nextAs.id]),
                                    Math.max(bucketAses[bucketKey1], globalUniqueOut[nextAs.id])
                                );
                                if (bucketAses[bucketKey1] == bestBucket){
                                    host.setAutonomousSystem(previousAs);
                                } else {
                                    host.setAutonomousSystem(nextAs);
                                }
                            }
                        }
                    }

                }

                previousHop = null;
            }
        };

        this._computeInOutRanks = function (traceroute) {
            var hop, hops, previousHost;

            hops = traceroute.getHops();

            previousHost = traceroute.source;
            for (var n=0,length=hops.length; n<length; n++){
                var attempt, host, asn, unique, nextHop, nextAttempt, nextHost;

                hop = hops[n];

                unique = {};
                attempt = hop.getMainAttempt();
                host = attempt.host;
                asn = host.getAutonomousSystem();

                if (asn){
                    if (!unique[asn.id]){
                        unique[asn.id] = true;
                        globalUniqueIn[asn.id] = globalUniqueIn[asn.id] || {};
                        globalUniqueIn[asn.id][previousHost.getId()] = true;
                        previousHost = host;

                        if (n < length - 1){
                            nextHop = hops[n + 1];
                            nextAttempt = nextHop.getMainAttempt();
                            nextHost = nextAttempt.host;

                            globalUniqueOut[asn.id] = globalUniqueOut[asn.id] || {};
                            globalUniqueOut[asn.id][nextHost.getId()] = true;
                        }
                    }
                }

            }

        };

        this.scanAllTraceroutes = function(traceroutes){
            var traceroute;

            for (var n=0,length=traceroutes.length; n<length; n++){

            }


            for (var n=0,length=traceroutes.length; n<length; n++) {
                this._computeInOutRanks(traceroutes[n]);
            }



            for (var k in globalUniqueIn){
                globalUniqueIn[k] = Object.keys(globalUniqueIn[k]).length;
            }

            for (var k in globalUniqueOut){
                globalUniqueOut[k] = Object.keys(globalUniqueOut[k]).length;
            }



            for (var n=0,length=traceroutes.length; n<length; n++){
                this._classifyNullNodes(traceroutes[n]);
                this._combinePrivateAndNullNodes(traceroutes[n]);
                this._cutHopsLength(traceroutes[n], env.maxNumberHops);
            }


        };





    };




    return HostClassificationHelper;

});

