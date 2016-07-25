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
        this.source = source;
        this.target = target;
        this.date = date;
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

    Traceroute.prototype.addHops = function(hops){
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

    return Traceroute;
});