define([
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(utils, $) {

    var Host = function (ip) { // Proxy
        this.ip = ip;
        this.isProbe = false;
        this.multiplicity = 1;

        if (this.ip) {
            this.isPrivate = utils.isPrivateIp(ip);
        }
    };


    Host.prototype.setProbeId = function(probeId) {
        this.isProbe = true;
        this.probeId = probeId;
    };


    Host.prototype.getId = function() {
        if (!this._id){
            if (this.ip && this._autonomousSystem && !this.isPrivate){
                this._id = this.ip + "-" + this._autonomousSystem.id;
            } else if (!this.ip && this._autonomousSystem) {
                this._id = "*" + Math.random() + "-" + this._autonomousSystem.id;
            }else if (this.isPrivate){
                this._id = "P" + this.ip + "-" + Math.random();
            } else if (this.ip){
                this._id = "" + this.ip;
            } else {
                this._id = "*" + Math.random();
            }
        }

        return this._id;
    };





    Host.prototype.setAutonomousSystem = function(autonomousSystem) {
        this._autonomousSystem = autonomousSystem;
    };

    Host.prototype.getAutonomousSystem = function() {
        return this._autonomousSystem;
    };


    Host.prototype.setLabel = function(label){
        this._label = label;
    };

    Host.prototype.getLabel = function(){
        this._label || this.getId();
    };


    return Host;
});