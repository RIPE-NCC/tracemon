/**
 * Copyright 2016 - mcandela
 * Date: 18/01/16
 * Time: 17:02
 * See LICENSE.txt for information about the license.
 */

define([
], function() {

    var Hop = function () {
        this._attempts = [];
        this.multiplicity = 1;
    };

    Hop.prototype.areAllNullHosts = function(){

        for (var n=0,length=this._attempts.length; n<length; n++){
            if (this._attempts[n].host.ip){
                return false;
            }
        }

        return true;
    };


    Hop.prototype.addAttempt = function(attempt){
        this._attempts.push(attempt);

    };

    Hop.prototype.getAttempts = function(){
        return this._attempts;
    };

    Hop.prototype.forEachAttempt = function(fun){
        for (var n=0,length=this._attempts.length; n<length; n++){
            fun(this._attempts[n]);
        }
    };

    Hop.prototype.getMainAttempt = function(){
        return this._attempts.sort((a, b) => b.rtt - a.rtt)[0];
    };

    Hop.prototype.toString = function(hopNumber){
        var out, unique, item, outString, mss, indentation;

        out = [];
        unique = {};
        outString = '';

        this.forEachAttempt(function(attempt){
            var key = attempt.host.ip || "*";
            if (!unique[key]) {
                item = {
                    host: attempt.host.toString(),
                    ms: []
                };
                if (attempt.rtt){
                    item.ms.push(attempt.rtt);
                }
                unique[key] = item;
                out.push(item);
            } else if (attempt.rtt){
                unique[key].ms.push(attempt.rtt);
            } else if (key == "*"){
                unique[key].host += ' ' + attempt.host.toString();
            }
        });

        for (var t=this.multiplicity; t>0; t--) {
            for (var n = 0; n < out.length; n++) {
                item = out[n];
                mss = item.ms.sort(function (a, b) {
                    return a - b
                });
                if (hopNumber) {
                    indentation = '      ';
                    if (n == 0) {
                        outString += hopNumber + indentation.substring(0, (indentation.length - ('' + hopNumber).length * 2));
                    } else {
                        outString += indentation;
                    }
                }
                outString += item.host + '  ';
                for (var m = 0; m < mss.length; m++) {
                    outString += '  ' + mss[m] + ' ms';
                }
                outString += '\n';
            }
            hopNumber++;
        }

        return outString;
    };

    Hop.prototype.containsHost = function(host){
        for (var n=0,length=this._attempts.length; n<length; n++){
            if (this._attempts[n].host.getId() == host.getId()){
                return true;
            }
        }

        return false;
    };

    return Hop;
});