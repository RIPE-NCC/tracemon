/**
 * Copyright 2014 - mcandela
 * Date: 04/09/14
 * Time: 23:25
 */

define([
    "latencymon.env.config",
    "latencymon.lib.socket-io",
    "latencymon.connector.translate-to-ping"
], function(config, io, translateToPing) {


    var LiveConnector = function (env) {
        var socket, $this;

        $this = this;
        this.connected = false;
        this.subscriptions = {};


        this.connect = function (options) {
            this.connected = true;
            socket = io(options.url, {path: options.path});
        };


        this._dispatcher = function(jsonData){
            var subscription;

            jsonData = translateToPing.translate(jsonData);

            subscription = $this.subscriptions[$this._getSubscriptionId(jsonData.msm_id, jsonData.prb_id)];

            if (subscription){
                subscription.callback.call(subscription.context, jsonData);
            }
        };


        this._getSubscriptionRequest = function(msmId, probeId){
            return {
                msm: msmId,
                prb: probeId,
                sendBacklog: config.sendBacklogStreaming
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
                        socket.emit("atlas_subscribe", $this._getSubscriptionRequest($this.subscriptions[sub].msmId, $this.subscriptions[sub].probeId));
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
                    socket.emit("atlas_subscribe", $this._getSubscriptionRequest(msmId, probeId));
                }

            }
        };


        this.unsubscribe = function (measurementId, probeId) {
            var key;

            key = this._getSubscriptionId(measurementId, probeId);
            if (this.subscriptions[key]) {
                socket.emit("atlas_unsubscribe", $this._getSubscriptionRequest(measurementId, probeId));
                delete this.subscriptions[key];
            }

        };


        this._getSubscriptionId = function(msmId, probeId){
            return msmId + '-' + probeId;
        };

    };

    return LiveConnector;
});