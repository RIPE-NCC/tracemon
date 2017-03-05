/**
 * Copyright 2016 - mcandela
 * Date: 18/01/16
 * Time: 17:02
 * See LICENSE.txt for information about the license.
 */

define([
], function() {

    var Traceroute = function (source, target, date) {
        this._hops = [];
        this.stateKey = source.getId() + '-' + target.getId();
        this.id = this.stateKey + '-' + date.unix();
        this.source = source;
        this.target = target;
        this.maxHopsAllowed = "[NO DATA]";
        this.packetSize = "[NO DATA]";
        target.isTarget = true;
        this.date = date;
        this.validUpTo = this.date;
        this._hash = null;
    };

    Traceroute.prototype.getReachedHost = function(){
        var hostList = this.getHostList();
        return (hostList.length > 0 ) ? hostList[hostList.length - 1] : null;
    };

    Traceroute.prototype.reachesTarget = function(){
        var lastHost;

        lastHost = this.getReachedHost();
        
        return (lastHost) ? (lastHost.ip == this.target.ip) : false;
    };

    Traceroute.prototype.setHops = function(hops){
        this._hops = hops;
    };

    Traceroute.prototype.addHop = function(hop){
        this._hops.push(hop);
    };

    Traceroute.prototype.getHops = function(){
        return this._hops;
    };

    Traceroute.prototype.forEachHop = function(fun){
        for (var n=0,length=this._hops.length; n<length; n++){
            fun(this._hops[n]);
        }
    };

    Traceroute.prototype.getHostList = function(){ // Main attempts
        var out;

        out = [this.source];
        for (var n = 0, length = this._hops.length; n < length; n++) {
            out.push(this._hops[n].getMainAttempt().host);
        }

        return out;
    };

    Traceroute.prototype.getLength = function(){
        return this.getHostList().length;
    };

    Traceroute.prototype.forEachHost = function(fun){
        var hosts = this.getHostList();
        for (var n=0,length=hosts.length; n<length; n++){
            fun(hosts[n]);
        }
    };

    Traceroute.prototype.getHash = function(){
        var attempts;

        if (!this._hash) {
            this._hash = "";
            for (var n = 0, length = this._hops.length; n < length; n++) {
                attempts = this._hops[n].getAttempts();
                this._hash += "-";
                for (var n1 = 0, length1 = attempts.length; n1 < length1; n1++) {
                    this._hash += attempts[n1].host.ip;
                }
            }
        }
        return this._hash;
    };

    Traceroute.prototype.getBestPathHash = function(){
        var hosts;

        if (!this._b_hash) {
            hosts = this.getHostList();
            this._b_hash = "";
            for (var n = 0, length = hosts.length; n < length; n++) {
                this._b_hash +=  "-" + hosts[n].ip;
            }
        }
        return this._b_hash;
    };

    Traceroute.prototype.getSingleLineString = function () {
        var attempt, rtt, host, asObj;

        rtt = 0;
        if (!this._singleLineString) {
            this._singleLineString = "source" + this.source.probeId + " ip" + this.source.ip;

            for (var n = 0, length = this._hops.length; n < length; n++) {
                attempt = this._hops[n].getMainAttempt();
                host = attempt.host;
                rtt += attempt.rtt;
                asObj = host.getAutonomousSystem();
                this._singleLineString += " ip" + host.ip + ((asObj) ? " as" + asObj.id : "");
            }
            this._singleLineString += " rtt" + rtt + " outcome" + ((this.reachesTarget()) ? "reached":"not-reached");
        }

        return this._singleLineString;
    };

    Traceroute.prototype.toString = function(){

        if (!this._string) {
            this._string = "";
            for (var n = 0, length = this._hops.length; n < length; n++) {
                this._string += this._hops[n].toString(n+1);
            }
        }

        return this._string;
    };

    return Traceroute;
});