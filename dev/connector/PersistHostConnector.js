/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd"
], function(config, $) {

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
                    dataType: "json",
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: "696",
                            message: config.errors["696"]
                        });
                    }
                });

            } else {
                env.utils.observer.publish("error", {
                    type: "502",
                    message: config.errors["502"]
                });
            }
        }


    };

    return PersistHostConnector;

});

