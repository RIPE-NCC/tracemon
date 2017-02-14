/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.parsePrefix",
    "tracemon.connector.local.peering-db" // TMP: REMOVE WHEN WE HAVE API
], function(config, utils, $, prefixUtils, localCache) {

    var PeeringDbConnector = function (env) {
        var $this, index, cache, oldDeferredCall;

        $this = this;
        index = null;
        cache = {};
        oldDeferredCall = null;

        this._createPrefixIndex = function(ixps, lans, prefixes){
            var ixpList, ixpIndex, ixpItem, lansList, lansIndex, lansItem, prefixList, prefixIndex, prefixItem;

            ixpList = ixps[0]["data"];
            ixpIndex = {};

            lansList = lans[0]["data"];
            lansIndex = {};

            prefixList = prefixes[0]["data"];
            prefixIndex = {};

            for (var n = 0, length = ixpList.length; n < length; n++) {
                ixpItem = ixpList[n];
                ixpIndex[ixpItem.id] = ixpItem;
            }

            for (var n = 0, length = lansList.length; n < length; n++) {
                lansItem = lansList[n];

                lansItem["ixp"] = ixpIndex[lansItem["ix_id"]];
                delete lansItem["ix_id"];
                lansIndex[lansItem.id] = lansItem;
            }

            for (var n = 0, length = prefixList.length; n < length; n++) {
                prefixItem = prefixList[n];

                prefixItem["lan"] = lansIndex[prefixItem["ixlan_id"]];
                delete prefixItem["ixlan_id"];
                prefixIndex[prefixUtils.encodePrefix(prefixItem["prefix"])] = prefixItem;
            }

            return prefixIndex;
        };

        this.createIndex = function(){

            if (oldDeferredCall){
                return oldDeferredCall;
            } else {
                var deferredCall;

                deferredCall = $.Deferred();

                if (localCache) {
                    deferredCall.resolve($this._createPrefixIndex([localCache.ixps], [localCache.lans], [localCache.prefixes]));
                } else {
                    $.when(this.getIxps(), this.getIxpLans(), this.getIxpPrefixes())
                        .done(function (ixps, lans, prefixes) {
                            deferredCall.resolve($this._createPrefixIndex(ixps, lans, prefixes));
                        });
                }

                oldDeferredCall = deferredCall.promise();

                return oldDeferredCall;
            }

        };


        this.checkIxp = function (ip) {
            var deferredCall;

            deferredCall = $.Deferred();


            if (cache[ip]){
                deferredCall.resolve(cache[ip]);
            } else {
                if (!index) {
                    this.createIndex()
                        .done(function (newIndex) {
                            index = newIndex;
                            deferredCall.resolve($this.searchOnIndex(ip));
                        });
                } else {
                    deferredCall.resolve($this.searchOnIndex(ip));
                }
            }

            return deferredCall.promise();
        };


        this.searchOnIndex = function (ip) {
            var encodedIp;

            encodedIp = prefixUtils.encodePrefix(ip);

            for (var prefix in index){
                if (encodedIp.indexOf(prefix) == 0) { // It is a ipx
                    cache[ip] = index[prefix];
                    return index[prefix];
                }
            }

            return false;
        };

        this.getIxps = function () {

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.peeringDb.ixps
            });

        };


        this.getIxpLans = function () {

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.peeringDb.lans
            });

        };

        this.getIxpPrefixes = function () {
            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.peeringDb.prefixes
            });
        };

    };

    return PeeringDbConnector;

});

