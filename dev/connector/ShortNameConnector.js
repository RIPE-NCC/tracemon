/**
 * Copyright 2017 - mcandela
 * Date: 21/02/17
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(config, utils, $) {

    var ShortNameConnector = function (env) {
        var $this, index, timer, oldDeferredCall, antiFlood, nextQuery, deferredCall, promise, asnToBePopulated;

        $this = this;
        index = null;
        timer = null;
        oldDeferredCall = null;
        antiFlood = 1000;
        nextQuery = [];
        deferredCall = null;
        promise = null;
        asnToBePopulated = null;

        this._translate = function(data){
            return data.data;
        };

        this._performQuery = function(nextQuery, deferredCall){
            console.log("now!");
            $.ajax({
                dataType: "jsonp",
                cache: false,
                data: {
                    asns: $.map(nextQuery, function(asn){return asn.id;}).join(",")
                },
                url: env.shortAsNamesApi
            }).done(function (data) {
                var names, name, asObj;

                names = $this._translate(data);

                for (var n=0,length=nextQuery.length; n<length; n++){
                    asObj = nextQuery[n];
                    name = names[asObj.id];
                    if (name) {
                        asObj.shortName = names[asObj.id];
                        utils.observer.publish("model.as:change", asObj);
                        console.log(asObj.shortName);
                    }
                }
                nextQuery = null;
                deferredCall.resolve();
                deferredCall = null;
            });
        };

        this.enrichShortName = function (asObj) {
            nextQuery.push(asObj);

            if (!timer && !deferredCall && !promise) {
                deferredCall = $.Deferred();
                promise = deferredCall.promise();
                timer = setTimeout(this._getShortNames, antiFlood);
            } else {
                clearTimeout(timer);
                timer = setTimeout(this._getShortNames, antiFlood);
            }

            return promise;
        };



        this._getShortNames = function () {
            $this._performQuery(nextQuery, deferredCall);
            nextQuery = [];
            deferredCall = null;
            promise = null;
            timer = null;
        };

    };

    return ShortNameConnector;

});

