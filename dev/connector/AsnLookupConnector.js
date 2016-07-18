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
        var hosts, $this, lookups;

        hosts = {};
        lookups = {};
        $this = this;
        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByPrefix = {};

        this.enrich = function (host, asData){
            var sameAs;

            sameAs = this._getSamePrefixAs(host.ip);

            if (sameAs) {

                host.setAutonomousSystem(sameAs);

            } else {

                if (!lookups[host.ip] && !hosts[host.ip]) {
                    lookups[host.ip] = host;

                    if (asData){
                        host.setAutonomousSystem($this._createAutonomousSystemObject(asData));
                    } else {
                        // DOWNLOAD DATA
                        host.setAutonomousSystem($this._createAutonomousSystemObject($this._performCall(host.ip)));
                    }


                }

            }
        };


        this._performCall = function (address){

            $this._getJSON(address, function(data) {
                if (data){
                    $this._updateObject(address, data[address]);
                }
            });

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


        this._createAutonomousSystemObject = function(asnData){
            var autonomousSystemObj, autonomousSystems, encodedPrefix, asn;

            asn = asnData.id;
            autonomousSystemObj = this.autonomousSystemsByAs[asn]; // Check if the object was already created

            if (!autonomousSystemObj) { // No, it wasn't
                autonomousSystemObj = new AutonomousSystem(asn); // Create a new model object
                this.autonomousSystemsByAs[asn] = autonomousSystemObj; // Store it
            }

            // autonomousSystemObj.addPrefix(annotation["prefix"]); // Annotate the object with the new prefix
            // encodedPrefix = "" + prefixUtils.encodePrefix(annotation["prefix"]); // Index the new prefix
            // if (!this.autonomousSystemsByPrefix[encodedPrefix]){
            //     this.autonomousSystemsByPrefix[encodedPrefix] = [];
            // }
            // this.autonomousSystemsByPrefix[encodedPrefix].push(autonomousSystemObj);

            return autonomousSystemObj;

        };

    };

    return AsnLookupConnector;

});

