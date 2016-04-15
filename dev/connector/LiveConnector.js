/**
 * Copyright 2014 - mcandela
 * Date: 04/09/14
 * Time: 23:25
 */

define([
    "tracemon.env.config",
    "tracemon.lib.socket-io"
], function(config, io) {


    var LiveConnector = function (env) {

        var socket, callback, context;


        socket = io(config.streamingUrl, { path : "/stream/socket.io" });


        socket.on("atlas_result", function(result){
            if (callback){
                callback.call(context, result);
            }
        });

        socket.on("atlas_error", function(result) {
            console.log(result); // For now, after propagate bubbling up
        });

        this.subscribe = function(filtering, callbackA, contextA) {
            callback = callbackA;
            context = contextA;
            socket.emit("atlas_subscribe", filtering); // possible: type, prb, msm, sourceAddress, sourcePrefix, destinationAddress, destinationPrefix
        }

    };

    return LiveConnector;
});