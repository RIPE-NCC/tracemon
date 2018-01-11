/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
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

], function(config, $, moment, HistoryConnector, LiveConnector, Hop, Host, Attempt, AutonomousSystem, Measurement,
            Traceroute, prefixUtils, PeeringDbConnector, HostClassificationHelper, AsnLookupConnector) {

    while(!moment){
        console.log("waiting");
        while(!moment.unix){

        }
    }


    var TranslationConnector = function (env) {
        var historyConnector, $this, liveConnector, peeringDbConnector, hostHelper, asnLookupConnector, selectedProbes;

        $this = this;
        historyConnector = new HistoryConnector(env);
        peeringDbConnector = new PeeringDbConnector(env);
        hostHelper = new HostClassificationHelper(env);
        asnLookupConnector = new AsnLookupConnector(env);

        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByPrefix = {};
        this.geolocByIp = {};
        this.neighboursByAs = {};
        this.hostByIp = {};
        this.measurementById = {};
        this.probesByMsm = {};
        this.probesById = {};
        this.tracerouteBySourceTarget = {};
        this.asList = {};
        this.geolocations = {};
        this.hostByProbeId = {};

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
                $this._enrichDump(formatOut, translated);
                callback.call(context, translated);
            }, this);
        };

        this._enrichIXP = function(host){

            peeringDbConnector
                .checkIxp(host.ip) // check if this is an Ixp
                .done(function(match) {
                    var ixp;

                    if (match){
                        ixp = match.ixp;

                        host.isIxp = true;
                        host.ixp = {
                            peeringDbId: ixp["id"],
                            name: ixp["name"],
                            country: ixp["country"],
                            city: ixp["city"],
                            prefix: match["lan"],
                            extra: { // These are optional
                                longName: ixp["name_long"],
                                orgId: ixp["org_id"],
                                website: ixp["website"],
                                techPhone: ixp["tech_phone"],
                                techEmail: ixp["tech_email"],
                                policyEmail: ixp["policy_email"],
                                policyPhone: ixp["policy_phone"],
                                region: ixp["region_continent"],
                                ipv6Support: ixp["proto_ipv6"],
                                multicastSupport: ixp["proto_multicast"]
                            }
                        };
                        env.utils.observer.publish("model.host:change", host);
                    }
                });

        };

        /* Issue: Sometimes the same IP appears twice on the traceroute due to...(BGP conversion, traceroute anomalities)
         * this creates cycles destroying the layout.
         * Solutions:
         * 1) prefer to return as getBestAttempts only "new" nodes for that traceroute
         * 2) create a new different host for the second time the same IP appears*/
        this._enrichDump = function(data, dump){
            var translated, hops, hop, item, hopList, attempts, attemptsList, hopObj, attemptObj, tracerouteDate,
                errors, locations, tracerouteList, targetTraceroute, asnObjs, asnTmp, asList, attemptTmp,
                sourceTraceroute, rootMeasurement;

            asnObjs = {};
            asList = data['asns'] || data['ases'];
            locations = data['geolocations'];
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
            $.extend(this.geolocations, locations);
            tracerouteList = data['result'] || data['traceroutes'] || [];

            for (var n1=0,length1 = tracerouteList.length; n1<length1; n1++) {
                hops = [];
                item = tracerouteList[n1];

                tracerouteDate = moment.unix(item["timestamp"]).utc();

                if (selectedProbes.indexOf(item["prb_id"]) == -1){
                    console.log("ALERT: the API is returning more results than what requested. Preformances may be affected.");
                    continue;
                }

                if (tracerouteDate.isAfter(env.finalQueryParams.stopDate)
                    || tracerouteDate.isBefore(env.finalQueryParams.startDate)) {
                    console.log("ALERT: the API is returning results out of the selected time range. They are skipped");
                    continue;
                }

                errors = [];
                hopList = item["result"];

                for (var hopCount=0, hopListLength=hopList.length; hopCount<hopListLength; hopCount++) {
                    hop = hopList[hopCount];
                    if (hop.error || !hop.hop){
                        errors.push(hop.error || "One hop was empty");
                    } else {
                        attemptsList = hop["result"];
                        attempts = [];

                        hopObj = new Hop();
                        hopObj.number = hop["hop"];

                        for (var n3 = 0, length3 = attemptsList.length; n3 < length3; n3++) {
                            attemptTmp = attemptsList[n3];

                            if (config.filterLateAnswers && attemptTmp["from"] && !attemptTmp["rtt"]) { // Skip late answers or resending
                                continue;
                            }
                            attemptObj = new Attempt();

                            attemptObj.host = this._createHost(attemptTmp["from"], null, attemptTmp["as"], (hopListLength - 1 == hopCount), null, attemptTmp["geo_key"]);

                            if (attemptTmp["rtt"]) {
                                attemptObj.rtt = attemptTmp["rtt"];
                                attemptObj.size = attemptTmp["size"];
                                attemptObj.ttl = attemptTmp["ttl"];
                            }
                            hopObj.addAttempt(attemptObj);
                        }
                        hops.push(hopObj);
                    }
                }

                rootMeasurement = this.measurementById[item["msm_id"]];

                sourceTraceroute = this._createHost(item["from"], null, item["from_as"], null, item['prb_id'], item["from_geo_key"]);

                if (item["dst_addr"]){
                    targetTraceroute = this._createHost(item["dst_addr"], item["dst_name"], item["dst_as"], null, null, item["dst_geo_key"]);

                    if (rootMeasurement.target.ip) {
                        targetTraceroute.isCdn = (rootMeasurement.target.ip != targetTraceroute.ip);
                        if (rootMeasurement.target.getAutonomousSystem()){
                            targetTraceroute.isLocalCache = (rootMeasurement.target.getAutonomousSystem().id != targetTraceroute.getAutonomousSystem().id);
                        }
                    }
                    translated = new Traceroute(sourceTraceroute, targetTraceroute, tracerouteDate);
                } else {
                    targetTraceroute = rootMeasurement.target;
                    translated = new Traceroute(sourceTraceroute, targetTraceroute, tracerouteDate);
                    translated.failed = true;
                }

                translated.setHops(hops);
                translated.errors = errors;

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

        this._createHost = function(address, name, asn, isLast, probeId, hostGeolocation){
            var host, update;

            host = this.hostByIp[address];

            update = host && address && true;

            if (!update) {
                host = new Host(address, env);
            }

            host.name = name;

            if (isLast != null){
                host.isLast = isLast;
            }

            if (probeId != null){
                host.setProbeId(probeId);
                this.hostByProbeId[probeId] = host;
            }

            if (!host.isPrivate && address) {

                if (hostGeolocation !== undefined) { // The geolocation key is NOT missing in the json

                    if (hostGeolocation == null){ // We tried but we don't have a geolocation
                        host.setLocation(null);
                    } else {
                        host.setLocation(this._recoverHostLocation(hostGeolocation), true); // We have a geolocation
                    }
                } else if (config.premptiveGeolocation) {
                    env.connector.getGeolocation(host);
                }

                if (config.premptiveReverseDns) {
                    env.connector.getHostReverseDns(host);
                }

                if (!update && asn != null) {
                    asnLookupConnector.enrich(host, this.asList[asn]);
                }

                if (config.ixpHostCheck) {
                    $this._enrichIXP(host);
                }

                this.hostByIp[address] = host; // Only if not private
            }

            env.utils.observer.publish("model.host:" + (update ? "change": "new"), host);

            return host;
        };

        this._recoverHostLocation = function(geoKey){
            var id, type, out, city, data;

            out = null;
            data = this.geolocations[geoKey];
            if (data) {
                out = {
                    id: data["id"],
                    type: data["type"],
                    country: data["country"],
                    city: data["city"],
                    countryCode: data["country_iso"]
                };
            }

            return out;
        };

        this.getMeasurementResults = function (measurement, options){
            var deferredCall;

            deferredCall = $.Deferred();

            selectedProbes = options.sources;
            try {
                historyConnector
                    .getMeasurementResults(measurement.id, options)
                    .done(function(data){
                        var newTraceroutes;

                        newTraceroutes = [];

                        measurement.empty();
                        $this.tracerouteBySourceTarget = {};

                        $this._enrichDump(data, newTraceroutes);
                        measurement.addTraceroutes(newTraceroutes);
                        deferredCall.resolve(measurement);
                    })
                    .fail(function (error) {
                        deferredCall.reject(error);
                    });
            } catch(error) {
                deferredCall.reject(error);
            }

            return deferredCall.promise();
        };

        this.getMeasurementInfo = function (measurementId){
            var deferredCall;

            deferredCall = $.Deferred();

            if (this.measurementById[measurementId]){ // TODO: Cache, it would be nice to move this somewhere else
                return deferredCall.resolve(this.measurementById[measurementId]);
            } else {
                try{
                    historyConnector.getMeasurementInfo(measurementId)
                        .done(function (data) {
                            var measurement, targetHost, extra, error;

                            error = data["error"];
                            if (error) {
                                deferredCall.reject(error.status);
                            } else if (data["type"] != "traceroute") {
                                deferredCall.reject("406");
                            } else {
                                targetHost = $this._createHost(data["target_ip"], data["target"], -1, null, null, data["target_location"]);
                                targetHost.isTarget = true;
                                measurement = new Measurement(measurementId, targetHost, data["native_sampling"]);

                                // Extra information
                                extra = data["extra"] || {};
                                measurement.timeout = extra["response_timeout"];
                                measurement.protocol = extra["protocol"];
                                measurement.parisId = extra["paris"];
                                measurement.numberOfPackets = extra["packets"];
                                measurement.startFromHop = extra["firsthop"];
                                measurement.maxHopsAllowed = extra["maxhops"];
                                measurement.packetSize = extra["size"];

                                measurement.startDate = moment.unix(data["start_time"]).utc();
                                measurement.stopDate = (data["stop_time"]) ? moment.unix(data["stop_time"]).utc() : null;
                                $this.measurementById[measurement.id] = measurement;

                                $this.getProbesInfo(measurement.id)
                                    .done(function (sources) {
                                        var source;

                                        for (var n = 0, length = sources.length; n < length; n++) {
                                            source = sources[n];
                                            source.measurements.push(measurement);
                                            measurement.sources[source.id] = source;
                                        }

                                        deferredCall.resolve(measurement);
                                    });
                            }
                        })
                        .fail(function (error) {
                            deferredCall.reject(error);
                        });
                } catch(error) {
                    deferredCall.reject(error);
                }
            }
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

        this.getHostReverseDns = function(host){
            var deferredCall;

            deferredCall = $.Deferred();

            if (!host.isPrivate){

                try {
                    historyConnector.getHostReverseDns(host.ip)
                        .done(function (data) {
                            var completeDomain, results, reverseArray, shortenedDomain, out;

                            results = data["data"]["result"];
                            out = null;

                            if (results) {
                                completeDomain = results[0];
                                reverseArray = completeDomain.split(".");

                                if (reverseArray.length > 2){ // DAR-3047: consider compounded second level country domains (e.g. co.uk) for short reverse lookup labels
                                    var firstLevel, secondLevel, thirdLevel;

                                    firstLevel = reverseArray[reverseArray.length - 1];
                                    secondLevel = reverseArray[reverseArray.length - 2];
                                    thirdLevel = reverseArray[reverseArray.length - 3];

                                    if (secondLevel.length == 2){
                                        shortenedDomain = [thirdLevel, secondLevel, firstLevel].join(".");
                                    } else {
                                        shortenedDomain = [secondLevel, firstLevel].join(".");
                                    }
                                }

                                out = {
                                    short: shortenedDomain || completeDomain,
                                    complete: completeDomain
                                };

                            }

                            host.reverseDns = out;
                            deferredCall.resolve(out);
                            env.utils.observer.publish("model.host:change", host);
                        });
                } catch(error) {
                    deferredCall.reject(error);
                }
            }

            return deferredCall.promise();
        };

        this.getGeolocation = function(host, force){
            var deferredCall;

            deferredCall = $.Deferred();

            historyConnector
                .getGeolocation(host.ip, force)
                .done(function (geolocRaw) {
                    var geolocation;

                    if (geolocRaw) {

                        if (geolocRaw.locating){
                            env.utils.observer.publish("model.host:locating", host);
                        }
                        if (geolocRaw["id"]){ // There is anyway a location
                            // Format for suggestor API
                            geolocation = {
                                city: geolocRaw["cityName"],
                                countryCode: geolocRaw["countryCodeAlpha2"],
                                id: geolocRaw["id"],
                                type: geolocRaw["type"],
                                score: geolocRaw["score"]
                            };

                            if (geolocation.score > 90) {
                                host.isEditable = false;
                            }
                        }
                    } else {
                        env.utils.observer.publish("model.host:no-location", host);
                    }

                    $this.geolocByIp[host.ip] = geolocation;
                    host.setLocation(geolocation, true);
                    deferredCall.resolve(geolocation);
                    env.utils.observer.publish("model.host:change", host);
                })
                .fail(function (error) {
                    deferredCall.reject(error);
                });

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
                    })
                    .fail(function (error) {
                        deferredCall.reject(error);
                    });
            }

            return deferredCall.promise();
        };

        this.getProbeInfo = function(probeId){
            return $this.probesById[probeId];
        };

        this.getSourceHosts = function () {
            return this.hostByProbeId;
        };

        this.getSparseHost = function (ip) {
            return this._createHost(ip, null, null, false, null, undefined);
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
                    })
                    .fail(function (error) {
                        deferredCall.reject(error);
                    });

            }

            return deferredCall.promise();
        }
    };

    return TranslationConnector;

});

