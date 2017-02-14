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
        target.isTarget = true;
        this.date = date;
        this.validUpTo = this.date;
        this._hash = null;
    };

    Traceroute.prototype.reachesTarget = function(){
        var lastHop;

        lastHop = this._hops[this._hops.length - 1];
        if (lastHop){
            return (lastHop.getMainAttempt().host.ip == this.target.ip);
        }

        return false;
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
        var attempts, host, reverse, rtt, stringLine, lineNumber;

        if (!this._string) {
            this._string = "";
            lineNumber = 0;
            for (var n = 0, length = this._hops.length; n < length; n++) {
                attempts = this._hops[n].getAttempts();
                attempts = attempts.sort(function(a, b){return a.rtt-b.rtt});
                stringLine = [];
                for (var n1 = 0, length1 = attempts.length; n1 < length1; n1++) {

                    host = attempts[n1].host.ip || '*';
                    reverse = attempts[n1].host.reverseDns || attempts[n1].host.ip;
                    rtt = attempts[n1].rtt;

                    stringLine.push(
                        host
                        + ((reverse) ? ' (' + reverse + ') ' : '')
                        + ((rtt) ? rtt : '')
                    );
                }

                this._string += lineNumber + "    " + stringLine.join("\n      ") + "\n";
                lineNumber ++;
            }
        }

        return this._string;
    };

    return Traceroute;
});