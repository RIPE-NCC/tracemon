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
    "tracemon.connector.peering-db",
    "tracemon.connector.host-helper",
    "tracemon.connector.asn"

], function(config, utils, $, HistoryConnector, LiveConnector, Hop, Host, Attempt, AutonomousSystem, Measurement,
            Traceroute, prefixUtils, PeeringDbConnector, HostClassificationHelper, AsnLookupConnector) {

    var TranslationConnector = function (env) {
        var historyConnector, $this, liveConnector, peeringDbConnector, hostHelper, asnLookupConnector;

        $this = this;
        historyConnector = new HistoryConnector(env);
        peeringDbConnector = new PeeringDbConnector(env);
        hostHelper = new HostClassificationHelper(env);
        asnLookupConnector = new AsnLookupConnector(env);

        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByIp = {};
        this.autonomousSystemsByPrefix = {};
        this.domainByIp = {};
        this.geolocByIp = {};
        this.neighboursByAs = {};
        this.hostByIp = {};
        this.cacheDeferredCallsAS = {};
        this.measurementById = {};


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


        this._enrichIXP = function(attemptObj){

            peeringDbConnector
                .checkIxp(attemptObj.ip) // check if this is an Ixp
                .done(function(ixp) {
                    if (ixp !== false){
                        attemptObj.isIxp = true;
                        attemptObj.ixp = ixp;
                        utils.observer.publish("ixp-detected", attemptObj);
                    }
                });

        };

        this.enrichDump = function(data, dump){
            var translated, hops, hop, item, hopList, attempts, attemptsList, hostObj, hopObj, attemptObj,
                hostAddress, tmpHost, errors, hostAsn, asList, tracerouteList, targetTraceroute;

            asList = data['ases'];
            tracerouteList = data['traceroutes'];

            for (var n1=0,length1 = tracerouteList.length; n1<length1; n1++) {
                hops = [];
                item = tracerouteList[n1];
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
                            hostAsn = (attemptsList[n3]["as"] && attemptsList[n3]["as"] != 0) ? attemptsList[n3]["as"] : null;
                            tmpHost = $this.hostByIp[hostAddress];

                            if (tmpHost && !tmpHost.isPrivate) {
                                attemptObj.host = tmpHost;
                            } else {
                                if (hostAddress) {
                                    attemptObj.host = new Host(hostAddress);

                                    if (!attemptObj.host.isPrivate && hostAsn) { // It is a public host

                                        asList[hostAsn].id = hostAsn;
                                        asnLookupConnector.enrich(attemptObj.host, asList[hostAsn]);

                                        if (config.ixpHostCheck) {
                                            $this._enrichIXP(attemptObj.host);
                                        }
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
                hostAsn = item["from_as"];

                if (!hostObj.isPrivate) {
                    asList[hostAsn].id = hostAsn;
                    asnLookupConnector.enrich(hostObj, asList[hostAsn]);

                    if (config.ixpHostCheck) {
                        $this._enrichIXP(hostObj);
                    }
                }


                targetTraceroute = $this.measurementById[item["msm_id"]].target;
                translated = new Traceroute(hostObj, targetTraceroute, item["timestamp"]);
                translated.parisId = item["paris_id"];
                translated.protocol = item["proto"];
                translated.addHops(hops);
                translated.errors = errors;
                hostHelper.scanTraceroute(translated);
                dump.push(translated);
            }
            hostHelper.scanAllTraceroutes(dump);

        };


        this.getInitialDump = function (measurement, options){
            var deferredCall;

            deferredCall = $.Deferred();

            historyConnector
                .getInitialDump(measurement.id, options)
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
                    var measurement, msmTarget, targetHost;

                    msmTarget = data["target"];
                    if ($this.hostByIp[msmTarget]){
                        targetHost = $this.hostByIp[msmTarget];
                    } else {
                        targetHost = new Host(msmTarget);
                    }

                    measurement = new Measurement(measurementId, targetHost);
                    $this.measurementById[measurement.id] = measurement;

                    if (!targetHost.isPrivate) { // TODO: ASN LOOKUP FOR TARGET
                        // asnLookupConnector.enrich(targetHost);

                        // if (config.ixpHostCheck) {
                        //     $this._enrichIXP(targetHost);
                        // }
                    }

                    deferredCall.resolve(measurement);
                });

            return deferredCall.promise();

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


                        if (data && data["data"] && data["data"]["locations"] && data["data"]["locations"][0]) {
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
                        }

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

