/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.connector.history",
    "tracemon.connector.live",
    "tracemon.model.hop",
    "tracemon.model.host",
    "tracemon.model.attempt",
    "tracemon.model.autonomousSystem",
    "tracemon.model.measurement",
    "tracemon.model.traceroute",
    "tracemon.lib.parsePrefix",
    "tracemon.connector.peering-db"
], function(config, utils, $, HistoryConnector, LiveConnector, Hop, Host, Attempt, AutonomousSystem, Measurement, Traceroute, prefixUtils, PeeringDbConnector) {

    var TranslationConnector = function (env) {
        var historyConnector, $this, liveConnector, peeringDbConnector;

        $this = this;
        historyConnector = new HistoryConnector(env);

        peeringDbConnector = new PeeringDbConnector(env);

        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByIp = {};
        this.autonomousSystemsByPrefix = {};
        this.domainByIp = {};
        this.geolocByIp = {};
        this.neighboursByAs = {};
        this.hostByIp = {};


        liveConnector = new LiveConnector(env);

        this.getHosts = function(){
            var out;

            out = [];
            for (var ip in this.hostByIp){
                out.push(this.hostByIp[ip]);
            }

            return out;
        };

        this.getRealTimeResults = function(filtering, callback, context){

            liveConnector.subscribe(filtering, function(data){
                var translated;

                translated = [];
                this.enrichDump([data], translated);
                callback.call(context, translated);
            }, this);
        };



        this.enrichDump = function(data, dump){
            var translated, hops, hop, item, hopList, attempts, attemptsList, hostObj, hopObj, attemptObj,
                hostAddress, tmpHost, errors;

            for (var n1=0,length1 = data.length; n1<length1; n1++) {
                hops = [];
                item = data[n1];
                errors = [];
                hopList = item["result"];

                for (var n2=0, length2=hopList.length; n2<length2; n2++) {
                    hop = hopList[n2];
                    if (hop.error || !hop.hop){
                        errors.push(hop.error || "One hop was empty");
                    } else {
                        attemptsList = hop["result"];
                        attempts = [];

                        hopObj = new Hop();
                        hopObj.number = hop["hop"];

                        for (var n3 = 0, length3 = attemptsList.length; n3 < length3; n3++) {
                            attemptObj = new Attempt();
                            hostAddress = attemptsList[n3]["from"];
                            tmpHost = $this.hostByIp[hostAddress];

                            if (tmpHost && !tmpHost.isPrivate) {
                                attemptObj.host = tmpHost;
                            } else {
                                if (hostAddress) {
                                    attemptObj.host = new Host(hostAddress);

                                    if (config.ixpHostCheck) {
                                        peeringDbConnector.checkIxp(hostAddress) // check if this is an Ixp
                                            .done(function (ixp) {
                                                if (ixp !== false){
                                                    attemptObj.host.isIxp = true;
                                                    attemptObj.host.ixp = ixp;

                                                    console.log(attemptObj.host);
                                                }
                                            });
                                    }

                                    if (!attemptObj.host.isPrivate) {
                                        attemptObj.host.setDeferredCallAutonomousSystems($this.getAutonomousSystem(attemptsList[n3]["from"]));

                                        // attemptObj.host
                                        //     .getAutonomousSystems()
                                        //     .done(function(data){
                                        //
                                        //
                                        //     attemptObj.host.setAutonomousSystem();
                                        // });
                                    }
                                    $this.hostByIp[hostAddress] = attemptObj.host;
                                    utils.observer.publish("new-host", attemptObj.host);
                                } else {
                                    attemptObj.host = new Host(null);
                                    utils.observer.publish("new-host", attemptObj.host);
                                }
                            }

                            if (attemptsList[n3]["rtt"]) {
                                attemptObj.rtt = attemptsList[n3]["rtt"];
                                attemptObj.size = attemptsList[n3]["size"];
                                attemptObj.ttl = attemptsList[n3]["ttl"];
                            }
                            hopObj.addAttempt(attemptObj);
                        }
                        hops.push(hopObj);
                    }
                }

                hostObj = new Host(item["from"]);
                hostObj.setProbeId(item["prb_id"]);
                if (!hostObj.isPrivate) {
                    hostObj.setDeferredCallAutonomousSystems($this.getAutonomousSystem(hostObj.ip));
                }
                translated = new Traceroute(item["prb_id"], item["timestamp"]);
                translated.probe = hostObj;
                translated.parisId = item["paris_id"];
                translated.protocol = item["proto"];
                translated.measurementId = item["msm_id"];
                translated.addHops(hops);
                translated.errors = errors;
                utils.observer.publish("new-traceroute", translated);
                dump.push(translated);
            }


        };


        this.getInitialDump = function (measurementId, options){
            var deferredCall;

            deferredCall = $.Deferred();

            historyConnector.getInitialDump(measurementId, options)
                .done(function(data){
                    var dump;

                    dump = [];
                    $this.enrichDump(data, dump);

                    deferredCall.resolve(dump);
                });

            return deferredCall.promise();
        };


        this.getMeasurementInfo = function (measurementId){
            var deferredCall;

            deferredCall = $.Deferred();

            historyConnector.getMeasurementInfo(measurementId)
                .done(function(data){
                    var measurement, msmTarget;

                    msmTarget = data["target"];
                    measurement = new Measurement(measurementId, msmTarget);
                    deferredCall.resolve(measurement);
                });

            return deferredCall.promise();

        };


        this._createAutonomousSystemObject = function(annotation, ip){
            var asn, autonomousSystemObj, autonomousSystems, asPrefixes, encodedPrefix;

            autonomousSystems = [];

            if (annotation && annotation["asns"] && annotation["asns"].length > 0) { // The returned annotation contains something

                for (var n2 = 0, length2 = annotation["asns"].length; n2 < length2; n2++) { // For each returned AS

                    asn = annotation["asns"][n2]; // Get the ASN
                    autonomousSystemObj = this.autonomousSystemsByAs[asn]; // Check if the object was already created

                    if (!autonomousSystemObj) { // No, it wasn't
                        autonomousSystemObj = new AutonomousSystem(asn, "OWNER_TODO"); // Create a new model object
                        this.autonomousSystemsByAs[asn] = autonomousSystemObj; // Store it
                    }
                    autonomousSystemObj.addPrefix(annotation["prefix"]); // Annotate the object with the new prefix
                    encodedPrefix = "" + prefixUtils.encodePrefix(annotation["prefix"]); // Index the new prefix
                    if (!this.autonomousSystemsByPrefix[encodedPrefix]){
                        this.autonomousSystemsByPrefix[encodedPrefix] = [];
                    }
                    this.autonomousSystemsByPrefix[encodedPrefix].push(autonomousSystemObj);

                    autonomousSystems.push(autonomousSystemObj);

                }
                return autonomousSystems;
            }
            return null;
        };

        this._getSamePrefixAs = function(ip){
            var encodedIp;

            encodedIp = prefixUtils.encodePrefix(ip);

            for (var prefix in this.autonomousSystemsByPrefix){
                if (encodedIp.indexOf(prefix) == 0){
                    console.log("same AS");
                    return this.autonomousSystemsByPrefix[prefix];
                }
            }

            return false;
        };


        this.getAutonomousSystem = function(ip){
            var deferredCall, asbyPrefix;

            deferredCall = $.Deferred();
            //asbyIp = this.autonomousSystemsByIp[ip];
            //if (asbyIp) {
            //    deferredCall.resolve(asbyIp);
            //} else {
            asbyPrefix = this._getSamePrefixAs(ip);
            if (asbyPrefix){
                deferredCall.resolve(asbyPrefix);
            } else {
                historyConnector.getAutonomousSystem(ip)
                    .done(function (data) {

                        var autonomousSystems, annotations, asns;

                        annotations = data["data"];
                        autonomousSystems = [];
                        asns = (annotations) ? annotations["asns"] : [];

                        if (asns.length) {
                            autonomousSystems = $this._createAutonomousSystemObject(annotations, ip);

                            if (autonomousSystems.length > 1){
                                console.log(autonomousSystems);
                            }

                        }

                        deferredCall.resolve(autonomousSystems);
                    });
            }
            //}

            return deferredCall.promise();
        };


        this.getHostReverseDns = function(ip){
            var deferredCall;

            deferredCall = $.Deferred();

            if (utils.isPrivateIp(ip)){
                deferredCall.resolve("Private address");
            } else {

                if (this.domainByIp[ip]) {
                    deferredCall.resolve(this.domainByIp[ip]);
                } else {
                    historyConnector.getHostReverseDns(ip)
                        .done(function (data) {
                            var domain, results;

                            results = data["data"]["result"];

                            if (results) {
                                domain = results[0];
                                $this.domainByIp[ip] = domain;
                            } else {
                                domain = "Not found"
                            }
                            deferredCall.resolve(domain);
                        });
                }
            }

            return deferredCall.promise();
        };

        this.getGeolocation = function(ip){
            var deferredCall;

            deferredCall = $.Deferred();

            if (this.geolocByIp[ip]) {
                deferredCall.resolve(this.geolocByIp[ip]);
            } else {
                historyConnector.getGeolocation(ip)
                    .done(function (data) {
                        var geolocation, geolocRaw;

                        geolocRaw = data["data"]["locations"][0];
                        geolocation = {
                            city: geolocRaw["city"],
                            country: geolocRaw["country"],
                            latitude: geolocRaw["latitude"],
                            longitude: geolocRaw["longitude"],
                            extra: {
                                radius: 0,
                                coverage: geolocRaw["covered_percentage"],
                                accuracy: 100,
                                priority: 1,
                                prefixes: geolocRaw["prefixes"]
                            }
                        };
                        $this.geolocByIp[ip] = geolocation;
                        deferredCall.resolve(geolocation);
                    });
            }

            return deferredCall.promise();
        };


        this.getNeighbours = function(asn){
            var deferredCall;

            deferredCall = $.Deferred();

            if (this.neighboursByAs[asn]) {
                deferredCall.resolve(this.neighboursByAs[asn]);
            } else {

                historyConnector.getNeighbours(asn)
                    .done(function (data) {
                        var neighbours, neighboursList, neighbourItem;

                        neighboursList = [];
                        neighbours = data["data"]["neighbours"];

                        for (var n=0,length=neighbours.length; n<length; n++){
                            neighbourItem = neighbours[n];
                            neighboursList.push({
                                "asn": neighbourItem["ans"],
                                "score": neighbourItem["ans"]
                            });

                        }

                        $this.neighboursByAs[asn] = neighboursList;

                        deferredCall.resolve(neighboursList);
                    });
            }

            return deferredCall.promise();
        };
    };

    return TranslationConnector;

});

