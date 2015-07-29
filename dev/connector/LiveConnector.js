/**
 * Copyright 2014 - mcandela
 * Date: 04/09/14
 * Time: 23:25
 */

define([
    "env.config",
    "lib.socket-io"
], function(config, io) {


    var LiveConnector = function (env) {
        var socket, $this;

        $this = this;
        this.connected = false;
        this.subscriptions = {};


        this.connect = function (options) {
            this.connected = true;
            socket = io(options.url, {path: options.path});
        };


        this._dispatcher = function(data){
            var jsonData, subscription;

            jsonData = data;
            subscription = $this.subscriptions[$this._getSubscriptionId(jsonData.msm_id, jsonData.prb_id)];

            if (subscription){
                subscription.callback.call(subscription.context, jsonData);
            }
        };


        this.subscribe = function (msmId, probeId, callback, context, options) {
            var subscription, key;

            if (!this.connected) {
                $this.handShakeCompleted = false;
                this.connect(options); // socket in config
                socket.on('atlas_result', $this._dispatcher);


                socket.on('connect', function () {
                    $this.handShakeCompleted = true;
                    for (var sub in $this.subscriptions){
                        socket.emit("atlas_subscribe", {
                                msm: $this.subscriptions[sub].msmId,
                                prb: $this.subscriptions[sub].probeId,
                                sendBacklog: config.sendBacklogStreaming,
                                greaterThan: {
                                    timestamp: env.lastHistoricSample
                                }
                            }
                        );
                    }
                });
            }

            subscription = {
                callback: callback,
                context: context,
                probeId: probeId,
                msmId: msmId,
                options: options,
                dummyAnswer: options.dummyAnswer,
                dummyFrequency: options.dummyFrequency
            };

            key = this._getSubscriptionId(msmId, probeId);

            if (!this.subscriptions[key]) {
                this.subscriptions[key] = subscription;

                if ($this.handShakeCompleted) {
                    socket.emit("atlas_subscribe", {msm: msmId, prb: probeId});
                }

            }
        };


        this.unsubscribe = function (measurementId, probeId) {
            var key;
            //console.log("unsubscribe", probeId);

            key = this._getSubscriptionId(measurementId, probeId);
            if (this.subscriptions[key]) {
                socket.emit("atlas_unsubscribe", {msm: measurementId, prb: probeId});
                delete this.subscriptions[key];
            }

        };


        this._getSubscriptionId = function(msmId, probeId){
            return msmId + '-' + probeId;
        };

    };

    return LiveConnector;
});