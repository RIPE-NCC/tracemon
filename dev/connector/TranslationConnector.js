/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment",
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

], function(config, utils, $, moment, HistoryConnector, LiveConnector, Hop, Host, Attempt, AutonomousSystem, Measurement,
            Traceroute, prefixUtils, PeeringDbConnector, HostClassificationHelper, AsnLookupConnector) {

    var TranslationConnector = function (env) {
        var historyConnector, $this, liveConnector, peeringDbConnector, hostHelper, asnLookupConnector, selectedProbes;

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
        this.probesByMsm = {};
        this.probesById = {};
        this.tracerouteBySourceTarget = {};
        this.asList = {};


        liveConnector = new LiveConnector(env);

        this.getHosts = function(){
            var out;

            out = [];
            for (var ip in this.hostByIp){
                out.push(this.hostByIp[ip]);
            }

            return out;
        };

        this.getASes = function () {
            return this.asList;
        };

        this.getRealTimeResults = function(filtering, callback, context){

            liveConnector.subscribe(filtering, function(data){
                var translated, formatOut;

                translated = [];
                formatOut = {
                    traceroutes: data,
                    ases: {}
                };
                $this.enrichDump(formatOut, translated);
                callback.call(context, translated);
            }, this);
        };


        this._enrichIXP = function(attemptObj){

            peeringDbConnector
                .checkIxp(attemptObj.ip) // check if this is an Ixp
                .done(function(ixp) {
                    if (ixp !== false){
                        attemptObj.isIxp = true;
                        attemptObj.ixp = {
                            name: ixp.lan.ixp.name,
                            country: ixp.lan.ixp.country,
                            city: ixp.lan.ixp.city,
                            prefix: ixp.prefix,
                            protocol: ixp.protocol,
                            extra: { // These are optional
                                longName: ixp.lan.ixp.name_long,
                                description: ixp.lan.ixp.descr,
                                orgId: ixp.lan.ixp.org_id,
                                website: ixp.lan.ixp.website,
                                techPhone: ixp.lan.ixp.tech_phone,
                                techEmail: ixp.lan.ixp.tech_email,
                                policyEmail: ixp.lan.ixp.policy_email,
                                policyPhone: ixp.lan.ixp.policy_phone,
                                region: ixp.lan.ixp.region_continent,
                                ipv6Support: ixp.lan.ixp.proto_ipv6,
                                multicastSupport: ixp.lan.ixp.proto_multicast
                            }
                        };
                        utils.observer.publish("model.host:ixp", attemptObj);
                    }
                });

        };

        this.enrichDump = function(data, dump){
            var translated, hops, hop, item, hopList, attempts, attemptsList, hostObj, hopObj, attemptObj,
                hostAddress, tmpHost, errors, hostAsn, tracerouteList, targetTraceroute, asnObjs, asnTmp, asList;

            asnObjs = {};
            asList = data['asns'] || data['ases'];
            for (var asKey in asList){
                asnTmp = asList[asKey];
                asnObjs[asKey] = {
                    number: asKey,
                    holder: asnTmp.holder,
                    announced: asnTmp.announced,
                    block: asnTmp.block
                }
            }
            $.extend(this.asList, asnObjs);
            tracerouteList = data['result'] || data['traceroutes'];

            for (var n1=0,length1 = tracerouteList.length; n1<length1; n1++) {
                hops = [];
                item = tracerouteList[n1];

                if (selectedProbes.indexOf(item["prb_id"]) == -1){
                    console.log("ALERT: the API is returning more results than what requested. Preformances may be affected.");
                    continue;
                }
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
                            hostAsn = attemptsList[n3]["as"];
                            tmpHost = $this.hostByIp[hostAddress];

                            if (tmpHost && !tmpHost.isPrivate) {
                                attemptObj.host = tmpHost;
                            } else {
                                if (hostAddress) {
                                    attemptObj.host = new Host(hostAddress);

                                    if (!attemptObj.host.isPrivate) { // It is a public host

                                        if (hostAsn == undefined || this.asList[hostAsn] && hostAsn != 0) {
                                            asnLookupConnector.enrich(attemptObj.host, this.asList[hostAsn]);
                                        }

                                        if (config.ixpHostCheck) {
                                            $this._enrichIXP(attemptObj.host);
                                        }
                                    }

                                    $this.hostByIp[hostAddress] = attemptObj.host;
                                    utils.observer.publish("model.host:new", attemptObj.host);
                                } else {
                                    attemptObj.host = new Host(null);
                                    utils.observer.publish("model.host:new", attemptObj.host);
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

                hostObj = $this.hostByIp[item["from"]];
                if (!hostObj) {
                    hostObj = new Host(item["from"]);
                    hostObj.setProbeId(item["prb_id"]);
                    hostAsn = item["from_as"];

                    if (!hostObj.isPrivate) {

                        if (hostAsn && this.asList[hostAsn]) {
                            asnLookupConnector.enrich(hostObj, this.asList[hostAsn]);
                        }

                        if (config.ixpHostCheck) {
                            $this._enrichIXP(hostObj);
                        }
                    }
                    $this.hostByIp[item["from"]] = hostObj;
                }

                targetTraceroute = $this.measurementById[item["msm_id"]].target;
                translated = new Traceroute(hostObj, targetTraceroute, moment.unix(item["timestamp"]).utc());
                translated.parisId = item["paris_id"];
                translated.protocol = item["proto"];
                translated.addHops(hops);
                translated.errors = errors;
                hostHelper.scanTraceroute(translated);

                if (
                    !config.filterRepeatedTraceroutes
                    || !$this.tracerouteBySourceTarget[translated.stateKey]
                    || translated.getHash() != $this.tracerouteBySourceTarget[translated.stateKey].getHash()
                ) {
                    dump.push(translated);
                    $this.tracerouteBySourceTarget[translated.stateKey] = translated;
                } else {
                    if ($this.tracerouteBySourceTarget[translated.stateKey].validUpTo < translated.date){
                        $this.tracerouteBySourceTarget[translated.stateKey].validUpTo = translated.date;
                    }
                }
            }
            hostHelper.scanAllTraceroutes(dump);

        };


        this.getInitialDump = function (measurement, options){
            var deferredCall;

            deferredCall = $.Deferred();

            selectedProbes = options.sources;
            historyConnector
                .getInitialDump(measurement.id, options)
                .done(function(data){
                    var dump;

                    dump = [];
                    $this.enrichDump(data, dump);

                    deferredCall.resolve(dump);
                })
                .fail(function (error) {
                    throw "The results for the selected measurement cannot be retrieved (timeout)"
                });

            return deferredCall.promise();
        };


        this.getMeasurementInfo = function (measurementId){
            var deferredCall;

            deferredCall = $.Deferred();

            historyConnector.getMeasurementInfo(measurementId)
                .done(function(data){
                    var measurement, msmTarget, targetHost;

                    if (data["type"] == "traceroute"){
                        msmTarget = data["target"];
                        if ($this.hostByIp[msmTarget]){
                            targetHost = $this.hostByIp[msmTarget];
                        } else {
                            targetHost = new Host(msmTarget);
                        }

                        measurement = new Measurement(measurementId, targetHost);

                        measurement.startDate = moment.unix(data["start_time"]).utc();
                        measurement.stopDate = (data["stop_time"]) ? moment.unix(data["stop_time"]).utc() : null;
                        measurement.interval = data["native_sampling"];
                        $this.measurementById[measurement.id] = measurement;

                        if (!targetHost.isPrivate) { // TODO: ASN LOOKUP FOR TARGET
                            // asnLookupConnector.enrich(targetHost);

                            // if (config.ixpHostCheck) {
                            //     $this._enrichIXP(targetHost);
                            // }
                        }

                        deferredCall.resolve(measurement);
                    } else {
                        throw "The measurement added is not a traceroute"
                    }

                })
                .fail(function() {
                    throw "The measurement added cannot be loaded, probably the ID doesn't exist";
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
                                domain = null;
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


        this.getProbeInfo = function(probeId){
            return $this.probesById[probeId];
        };


        this.getProbesInfo = function(measurementId){
            var deferredCall;

            deferredCall = $.Deferred();

            if (this.probesByMsm[measurementId]){
                deferredCall.resolve(this.probesByMsm[measurementId]);
            } else {
                historyConnector
                    .getProbesInfo(measurementId)
                    .done(function (data) {
                        var probes, probe, probesArray, probeTmp;

                        probes = data["probes"];
                        probesArray = [];

                        for (var n=0,length=probes.length; n<length; n++) {
                            probe = probes[n];

                            if ($this.probesById[probe.id]) {
                                $this.probesById[probe.id].msmId = ',' + measurementId;
                            } else {
                                probeTmp = {
                                    id: probe.id,
                                    select: false,
                                    measurements: [measurementId],
                                    cc: probe.country_code,
                                    asv4: probe.asn_v4,
                                    asv6: probe.asn_v6,
                                    ipv4: probe.address_v4,
                                    ipv6: probe.address_v6
                                };

                                probesArray.push(probeTmp);
                                $this.probesById[probe.id] = probeTmp;
                            }
                        }
                        $this.probesByMsm[measurementId] = probesArray;
                        deferredCall.resolve(probesArray);
                    });
            }

            return deferredCall.promise();
        }
    };

    return TranslationConnector;

});

