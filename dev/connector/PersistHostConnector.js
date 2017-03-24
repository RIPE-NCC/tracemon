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
                data: moment().utc().unix()
            };
        };

        this.persist = function(host){
            return $.ajax({
                type: "POST",
                url: env.persistHostApi,
                data: this._serializeHost(host),
                dataType: "json"
            });
        }


    };

    return PersistHostConnector;

});

