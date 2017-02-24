/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.model.autonomousSystem",
    "tracemon.lib.parsePrefix",
    "tracemon.connector.short-name"

], function(config, utils, $, AutonomousSystem, prefixUtils, ShortNameConnector) {

    var AsnLookupConnector = function (env) {
        var hosts, $this, lookups, shortNameConnector;

        hosts = {};
        lookups = {};
        $this = this;
        shortNameConnector = new ShortNameConnector(env);
        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByPrefix = {};

        this.enrich = function (host, asData){
            var sameAs;

            sameAs = this._getSamePrefixAs(host.ip);


            if (sameAs) {

                host.setAutonomousSystem(sameAs);

            } else {

                if (asData){
                    host.setAutonomousSystem($this._createAutonomousSystemObject(asData));
                } else {

                    console.log("[AS lookup] No local info for host", host);

                    if (hosts[host.ip]){
                        $this._updateObject(host, hosts[host.ip]);
                    } else {
                        $this._getJSON(host.ip)
                            .done(function(data){
                                hosts[host.ip] = $this._translate(host.ip, data);
                                $this._updateObject(host, hosts[host.ip]);
                            });
                    }
                }

            }
        };


        this._getJSON = function (resources) {
            if (!lookups[resources]) {

                lookups[resources] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    url: env.dataApiAsAnnotation,
                    data: {
                        resources: resources,
                        resource: resources
                    }
                });

            }

            return lookups[resources];
        };


        this._translate = function (ip, data){
            var autonomousSystem, ases, asns, lookups;

            ases = data["ases"];
            lookups = data["lookups"];
            autonomousSystem = [];

            if (lookups[ip] && ases[lookups[ip]]){
                autonomousSystem = this._createAutonomousSystemObject(ases[lookups[ip]]);
            }


            return autonomousSystem;
        };

        this._updateObject = function (host, asObj){
            host.setAutonomousSystem(asObj);
            utils.observer.publish("model.host:as", host);
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


        this._createAutonomousSystemObject = function(asnData){
            var autonomousSystemObj, asn;

            asn = asnData.number;
            autonomousSystemObj = this.autonomousSystemsByAs[asn]; // Check if the object was already created

            if (!autonomousSystemObj) { // No, it wasn't
                autonomousSystemObj = new AutonomousSystem(asn); // Create a new model object
                autonomousSystemObj.owner = asnData["holder"];
                autonomousSystemObj.announced = asnData["announced"];
                autonomousSystemObj.extra = asnData["block"];
                shortNameConnector.enrichShortName(autonomousSystemObj);
                this.autonomousSystemsByAs[asn] = autonomousSystemObj; // Store it
            }

            return autonomousSystemObj;

        };

    };

    return AsnLookupConnector;

});

