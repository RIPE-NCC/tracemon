/**
 * Copyright 2016 - mcandela
 * Date: 18/01/16
 * Time: 17:02
 * See LICENSE.txt for information about the license.
 */

define([
], function() {

    var Traceroute = function (source, date) {
        this._hops = [];
        this.source = source;
        this.date = date;
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
    
    return Traceroute;
});