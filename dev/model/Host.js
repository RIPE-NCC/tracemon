define([
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(utils, $) {

    var Host = function (ip) { // Proxy
        this.ip = ip;
        this.isProbe = false;
        this._autonomousSystems = [];

        this.isPrivate = utils.isPrivateIp(ip);
    };


    Host.prototype.setProbeId = function(probeId) {
        this.isProbe = true;
        this.probeId = probeId;
    };


    Host.prototype.getId = function() {
        if (this._autonomousSystem == null){
            throw "Set the AutonomousSystem to get the ID of this host";
        }
        return this.ip + "-" + this._autonomousSystem;
    };



    Host.prototype.setAutonomousSystem = function(autonomousSystem) {
        this._autonomousSystem = autonomousSystem;
    };

    Host.prototype.getAutonomousSystem = function() {
        return this._autonomousSystem;
    };

    Host.prototype.addAutonomousSystem = function(autonomousSystem){
        this._autonomousSystems.push(autonomousSystem);
        autonomousSystem.addHost(this);
        if (this._autonomousSystem == null){
            this._autonomousSystem = this._autonomousSystems[0];
        }
    };





    Host.prototype.addAutonomousSystems = function (asns) {
        for (var n=0,length=asns.length; n<length; n++) {
            this.addAutonomousSystem(asns[n]);
        }
    };

    Host.prototype.getAutonomousSystems = function(){
        return this._autonomousSystems;
    };

    return Host;
});