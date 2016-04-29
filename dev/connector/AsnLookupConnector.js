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
    "tracemon.lib.parsePrefix"
], function(config, utils, $, AutonomousSystem, prefixUtils) {

    var AsnLookupConnector = function (env) {
        var hosts, grouped, $this, antiFloodTimer, antiFloodTime, lookups, autonomousSystem;

        hosts = {};
        lookups = {};
        grouped = false;
        $this = this;
        antiFloodTime = 1000;
        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByPrefix = {};

        this.enrich = function (host){
            var sameAs;

            sameAs = this._getSamePrefixAs(host.ip);

            if (sameAs) {

                host.setAutonomousSystem(sameAs);

            } else {

                if (!lookups[host.ip] && !hosts[host.ip]) {
                    lookups[host.ip] = host;

                    clearTimeout(antiFloodTimer);
                    antiFloodTimer = setTimeout(this._performCalls, antiFloodTime);
                }

            }
        };


        this._performCalls = function (){
            var resources, hostIp, annotation;

            resources = Object.keys(lookups);

            if (grouped) {

                $this._getJSON(resources, function (data) {
                    for (var n=0,length=data.length; n<length; n++) {
                        annotation = data[n];
                        hostIp = annotation.resource;
                        $this._updateObject(hostIp, annotation.asns);
                    }
                });

            } else {

                for (var n=0,length=resources.length; n<length; n++) {
                    hostIp = resources[n];
                    $this._getJSON(hostIp, function(data) {
                        if (data){
                            $this._updateObject(hostIp, data[hostIp]);
                        }
                    });
                }

            }

        };



        this._getJSON = function (resource, callback) {
            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.dataApiAsAnnotation,
                data: {
                    resource: resource
                }
            }).done(function (data) {
                callback($this._translate(data));
            });
        };


        this._translate = function (data){
            var autonomousSystems, annotations, asns, translated;

            annotations = data["data"];
            autonomousSystems = [];
            asns = (annotations) ? annotations["asns"] : [];

            if (asns.length) {
                autonomousSystems = this._createAutonomousSystemObject(annotations);
                translated = autonomousSystems[0];

                if (autonomousSystems.length > 1){
                    console.log("check BGP neighbours for: ", autonomousSystems);
                }

            }

            return translated;
        };

        this._updateObject = function (ip, asns){

            lookups[ip].setAutonomousSystem(asns);
            hosts[ip] = lookups[ip];

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


        this._createAutonomousSystemObject = function(annotation){
            var asn, autonomousSystemObj, autonomousSystems, encodedPrefix;

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

    };

    return AsnLookupConnector;

});

