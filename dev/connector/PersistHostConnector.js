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

            if (location === undefined){
                throw "Nothing to persist. The location for this host is not set."
            }
            return {
                id: location.id,
                type: location.type,
                cityName: location.city,
                country: location.countryCode
            };
        };

        this.persist = function(host){

            if (host.isEditable) {
                var serializedHost;

                serializedHost = this._serializeHost(host);

                return $.ajax({
                    type: "POST",
                    url: env.persistHostApi.replace("0000", host.ip),
                    data: serializedHost,
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

