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
        var $this, index, cache, oldDeferredCall, callsBundler;

        $this = this;
        index = null;
        cache = {};
        callsBundler = {
            queries: {},
            timer: null
        };
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
            var deferredCall, realCall;

            realCall = function(queries){
                var ips = Object.keys(queries);
                $this.getIxpFromApi(ips)
                    .done(function(ixps){
                        if (ixps.data) {
                            ips.forEach(function (ip) {
                                queries[ip].resolve(ixps.data[ip]);
                            });
                        }
                    });
            };

            if (!cache[ip]){

                deferredCall = $.Deferred();
                cache[ip] = deferredCall.promise();
                callsBundler.queries[ip] =  deferredCall;
                clearTimeout(callsBundler.timer);

                if (Object.keys(callsBundler.queries).length < config.maxBundledQueries) {
                    callsBundler.timer = setTimeout(function () {
                        realCall(callsBundler.queries);
                        callsBundler.queries = {};
                    }, config.queryGroupingAntiFlood);
                } else {
                    realCall(callsBundler.queries);
                    callsBundler.queries = {};
                }
            }

            return cache[ip];
        };

        this.getIxpFromApi = function (ips) {

            return $.ajax({
                dataType: "jsonp",
                cache: false,
                url: env.peeringDb.ixps,
                data: {
                    resources: ips.join(",")
                }
            });

        };

        this.searchOnIndex = function (ip) {
            var encodedIp;

            encodedIp = prefixUtils.encodePrefix(ip);

            for (var prefix in index){
                if (encodedIp.indexOf(prefix) == 0) { // It is an ixp
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

