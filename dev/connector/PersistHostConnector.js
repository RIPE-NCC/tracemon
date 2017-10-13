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

    var PersistHostConnector = function (env) {

        this._serializeHost = function(host){
            var location = host.getLocation();

            return {
                id: location.id,
                type: location.type,
                cityName: location.city,
                country: location.countryCode
            };
        };

        this.persist = function(host){
            if (host.isEditable) {

                return $.ajax({
                    type: "POST",
                    url: env.persistHostApi.replace("0000", host.ip),
                    data: this._serializeHost(host),
                    dataType: "json"
                });

            } else {
                throw "502"; // The resource cannot be persisted
            }
        }


    };

    return PersistHostConnector;

});

