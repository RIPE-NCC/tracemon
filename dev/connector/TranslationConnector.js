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
    "tracemon.model.hop",
    "tracemon.model.host",
    "tracemon.model.attempt",
    "tracemon.model.autonomousSystem",
    "tracemon.model.measurement",
    "tracemon.model.traceroute",
    "tracemon.lib.parsePrefix"
], function(config, utils, $, HistoryConnector, Hop, Host, Attempt, AutonomousSystem, Measurement, Traceroute, prefixUtils) {

    var TranslationConnector = function (env) {
        var historyConnector, $this;

        $this = this;
        historyConnector = new HistoryConnector(env);
        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByIp = {};
        this.autonomousSystemsByPrefix = {};
        this.domainByIp = {};
        this.geolocByIp = {};
        this.hostByIp = {};

        this.getInitialDump = function (measurementId, options){
            var deferredCall;

            deferredCall = $.Deferred();

            historyConnector.getInitialDump(measurementId, options)
                .done(function(data){
                    var translated, hops, hop, item, hopList, attempts, attemptsList, hostObj, hopObj, attemptObj,
                        hostAddress, tmpHost, dump, errors;

                    dump = [];
                    for (var n1= 0,length1 = data.length; n1<length1; n1++) {
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
                                            if (!attemptObj.host.isPrivate) {
                                                attemptObj.host.setDeferredCallAutonomousSystems($this.getAutonomousSystem(attemptsList[n3]["from"]));
                                            }
                                            $this.hostByIp[hostAddress] = attemptObj.host;
                                            utils.observer.publish("new-host", attemptObj.host);
                                        } else {
                                            attemptObj.host = new Host(null);
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

                        dump.push(translated);
                    }

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
                    //if (!this.autonomousSystemsByIp[ip]){
                    //    this.autonomousSystemsByIp[ip] = [];
                    //}
                    //this.autonomousSystemsByIp[ip].push(autonomousSystemObj); // Index this AS by IP
                    //asPrefixes = autonomousSystemObj.getPrefixes();

                    //for (var n3=0,length3=asPrefixes.length; n3<length3; n3++){
                    encodedPrefix = "" + prefixUtils.encodePrefix(annotation["prefix"]); // Index the new prefix
                    if (!this.autonomousSystemsByPrefix[encodedPrefix]){
                        this.autonomousSystemsByPrefix[encodedPrefix] = [];
                    }
                    this.autonomousSystemsByPrefix[encodedPrefix].push(autonomousSystemObj);
                    //}

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
                        var autonomousSystems, annotations;

                        annotations = data["data"];
                        autonomousSystems = [];

                        if (annotations.length) {
                            for (var n = 0, length = annotations.length; n < length; n++) {
                                autonomousSystems = $this._createAutonomousSystemObject(annotations[n], ip)
                            }
                        } else {
                            autonomousSystems = $this._createAutonomousSystemObject(annotations, ip)
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
    };

    return TranslationConnector;

});

