define([
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(utils, $) {

    var Host = function (ip) { // Proxy
        this.ip = ip;
        this.isProbe = false;
        this._autonomousSystems = [];

        this.isPrivate = utils.isPrivateIp(ip);

        if (this.isPrivate){
            this._id = null;
        } else {
            this._id = ip;
        }
    };


    Host.prototype.setProbeId = function(probeId) {
        this.isProbe = true;
        this.probeId = probeId;
    };




    Host.prototype.getId = function() {
        if (this._id == null){
            throw "Set the AutonomousSystem to get the ID of this host";
        }
        return this._id;
    };


    Host.prototype.addAutonomousSystem = function(autonomousSystem){
        this._autonomousSystems.push(autonomousSystem);
        autonomousSystem.addHost(this);
        if (!this._id){
            this._id = this._autonomousSystems[0].id + "-" + this.ip.replace(".", "-");
        }
    };


    Host.prototype.setDeferredCallAutonomousSystems = function(call) {
        var $this = this;

        this._deferredCallGetAutonomousSystems = call;
        this._deferredCallGetAutonomousSystems.done(function (data) {
            if (data) {
                for (var n = 0, length = data.length; n < length; n++) {
                    $this.addAutonomousSystem(data[n]);
                }
            }
        });
    };


    Host.prototype.getAutonomousSystems = function(){
        var deferredCall;

        if (this.isPrivate && this._autonomousSystems.length == 0){
            throw "The AutonomousSystem cannot be auto computed";
        } else if (this._autonomousSystems.length != 0) {
            deferredCall = $.Deferred();
            deferredCall.resolve(this._autonomousSystems);

            return deferredCall.promise();
        } else {
            if (!this._deferredCallGetAutonomousSystems){
                throw "The AutonomousSystem cannot be retrieved";
            }

            return this._deferredCallGetAutonomousSystems;
        }
    };

    return Host;
});