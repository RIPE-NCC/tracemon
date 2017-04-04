/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment"
], function(config, utils, $, moment) {

    var RipeDatabaseConnector = function (env) {
        var contactsByAsn, $this, abuseContactByAsn;

        $this = this;
        contactsByAsn = {};
        abuseContactByAsn = {};

        this._translateWhois = function(data){
            var attributes, objects, item, autNum, techContacts, roleContacts;

            techContacts = {};
            roleContacts = {};
            try { // The format is terrible, no meaning at all
                objects = data["objects"]["object"];
                autNum = null;
                for (var n=0,length=objects.length; n<length; n++){
                    item = objects[n];
                    if (item["type"] == "aut-num"){
                        autNum = item;
                        break;
                    }
                }

                attributes = autNum["attributes"]["attribute"];
                if (autNum && attributes){
                    for (var n=0,length=attributes.length; n<length; n++){
                        item = attributes[n];
                        if (item["name"] == "tech-c"){
                            if (item["referenced-type"] == "role"){
                                roleContacts[item["value"]] = true;
                            } else {
                                techContacts[item["value"]] = true;
                            }
                        }
                    }
                }


            } catch(e){
                throw "RIPE Database REST Api changed format - please update the method _translateWhois accordingly";
            }


            return {
                techContacts : Object.keys(techContacts), // Unique values
                roleContacts: Object.keys(roleContacts)
            };
        };

        this._translateAbuseContact = function(data){
            var contacts, contactsOut;

            try {
                contacts = data["data"]["anti_abuse_contacts"]["abuse_c"];

                contactsOut = $.map(contacts, function(contact){
                    return {
                        email: contact.email,
                        type: "abuse_c"
                    };
                });

            } catch(e){
                throw "RIPEstat Abuse contact API changed - please update the method _translateAbuseContact accordingly";
            }

            return contactsOut;
        };

        this._translatePerson = function(data){
            var attributes, objects, item, personObject, name, email;

            try { // The format is terrible, no meaning at all
                objects = data["objects"]["object"];
                personObject = null;
                for (var n=0,length=objects.length; n<length; n++){
                    item = objects[n];
                    if (item["type"] == "person" || item["type"] == "role"){
                        personObject = item;
                        break;
                    }
                }

                attributes = personObject["attributes"]["attribute"];
                if (personObject && attributes){
                    for (var n=0,length=attributes.length; n<length; n++){
                        item = attributes[n];

                        if (item["name"] == "person"){
                            name = item["value"];
                        }

                        if (item["name"] == "e-mail"){
                            email = item["value"];
                        }

                        if (name && email) {
                            break; // We have everything we need, just stop now
                        }
                    }
                }

            } catch(e){
                console.log(data);
                throw "RIPE Database REST Api changed format - please update the method _translatePerson accordingly";
            }


            return [{
                name : name,
                email: email,
                type: "tech-c"
            }];
        };

        this._handleError = function(error, deferredCall) {
            if (error == 404){ // Convert to specific error
                error = 695;
            }
            deferredCall.reject(error);
        };

        this.getAutonomousSystemContacts = function(asn){
            var abuseQuery, deferredCall;

            deferredCall = $.Deferred();

            this._whoisRestQuery(asn)
                .done(function(data){
                    var queries;

                    if (data["error"]){
                        $this._handleError(data["error"], deferredCall);
                    } else {

                        data = $this._translateWhois(data);
                        queries = $.map(data.techContacts, $this._personRestQuery);
                        queries = queries.concat($.map(data.roleContacts, $this._roleRestQuery));

                        abuseQuery = $this._getAbuseContacts(asn); // Add abuse_c queries

                        queries.push(abuseQuery);


                        try {
                            $.when
                                .apply($, queries)
                                .then(function () {
                                    var personsLists, cleanResults, persons;

                                    cleanResults = $.map([].slice.call(arguments), function (item) {
                                        return item[0];
                                    });

                                    personsLists = $.map(cleanResults, function (data) {
                                        if (data && !data["error"]) {
                                            return (data["objects"]) ? $this._translatePerson(data) : $this._translateAbuseContact(data);
                                        } else {
                                            throw 695; // If empty is anyway a 404
                                        }

                                    })
                                        .filter(function (item) {
                                            return item != null;
                                        });

                                    persons = [].concat.apply([], personsLists); // Flatten the array of array
                                    deferredCall.resolve(persons);
                                }, function (error) {
                                    $this._handleError(error, deferredCall);
                                });

                        } catch (error){
                            $this._handleError(error, deferredCall);
                        }
                    }
                });


            return deferredCall.promise();
        };



        this._getAbuseContacts = function(asn){
            if (!abuseContactByAsn[asn]) {
                abuseContactByAsn[asn] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: config.dataAPIs.abuseContactRestApi,
                    data:{
                        resource: "AS" + asn
                    },
                    error: function () {
                        utils.observer.publish("error", {
                            type: "408",
                            message: config.errors["408"]
                        });
                    }
                });
            }

            return abuseContactByAsn[asn];
        };

        this._whoisRestQuery = function (asn) {

            if (!contactsByAsn[asn]) {
                contactsByAsn[asn] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: config.dataAPIs.ripeDatabase.whois.replace("0000", asn),
                    error: function () {
                        utils.observer.publish("error", {
                            type: "408",
                            message: config.errors["408"]
                        });
                    }
                });
            }

            return contactsByAsn[asn];
        };


        this._roleRestQuery = function (roleId) {
            return $.ajax({
                dataType: "jsonp",
                cache: false,
                async: true,
                timeout: config.ajaxTimeout,
                url: config.dataAPIs.ripeDatabase.role.replace("0000", roleId),
                error: function () {
                    utils.observer.publish("error", {
                        type: "408",
                        message: config.errors["408"]
                    });
                }
            });
        };

        this._personRestQuery = function (personId) {
            return $.ajax({
                dataType: "jsonp",
                cache: false,
                async: true,
                timeout: config.ajaxTimeout,
                url: config.dataAPIs.ripeDatabase.person.replace("0000", personId),
                error: function () {
                    utils.observer.publish("error", {
                        type: "408",
                        message: config.errors["408"]
                    });
                }
            });
        };

    };

    return RipeDatabaseConnector;

});

