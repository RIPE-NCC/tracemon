define([
    "tracemon.env.utils",
    "tracemon.lib.jquery-amd"
], function(utils, $) {

    var Host = function (ip) { // Proxy
        this.ip = ip;
        this.isIxp = false;
        this.isProbe = false;
        this.isLast = false;
        this.isTarget = false;
        this.isCdn = false;
        this.isLocalCache = false;
        this.measurements = []; // Only for source
        this._location = undefined;
        this.dirty = false;

        if (this.ip) {
            this.isPrivate = utils.isPrivateIp(ip);
        }

        this.isEditable = (!this.isPrivate && !this.isProbe && this.ip && true);
    };

    Host.prototype.setProbeId = function(probeId) {
        this.isProbe = true;
        this.probeId = probeId;
        this.isEditable = (!this.isPrivate && !this.isProbe && this.ip && true);
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
        autonomousSystem.addHost(this);
        this._autonomousSystem = autonomousSystem;
    };

    Host.prototype.getAutonomousSystem = function() {
        return this._autonomousSystem;
    };


    Host.prototype.getLocation = function() {
        if (this.isPrivate || !this.ip){
            throw "501"; // Not possible to geolocate a private or a * host
        }

        return this._location;
    };


    Host.prototype.setLocation = function(locationObject, dontPersist) {
        if (this.isPrivate || !this.ip){
            throw "501";
        }

        if (!dontPersist){
            this.dirty = true;
        }
        this._location = locationObject;
    };

    Host.prototype.toString = function() {

        if (this.ip && this.reverseDns) {
            return this.reverseDns.complete + " (" + this.ip + ")";
        } else if (this.ip){
            return this.ip + " (" + this.ip + ")";
        } else {
            return "*";
        }
    };


    return Host;
});