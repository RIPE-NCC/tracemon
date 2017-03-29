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
                id: host.ip,
                geo_city: location.city,
                geo_cc: location.countryCode,
                geo_id: location.id,
                geo_type: location.type,
                data: moment().utc().unix()
            };
        };

        this.persist = function(host){
            if (!host.isPrivate && host.ip) {

                return $.ajax({
                    type: "POST",
                    url: env.persistHostApi,
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

