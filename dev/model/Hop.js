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
        this._attemptIndex = {};
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
        // var hosts, count, sorted, main;
        //
        // hosts = $.map(this._attempts, function(index, item){
        //     return item.host;
        // });
        // hosts.forEach(function(i) { count[i] = (count[i]||0)+1;  });
        // sorted = Object.keys(list).sort(function(a,b){return list[a]-list[b]});
        // main = sorted[sorted.length - 1];
        //
        // for (var i = 0; i < this._attempts.length; i++) {
        //     if (this._attempts[i].host == main){
        //         return this._attempts[i];
        //     }
        // }

        return this._attempts[0]; // Easy for now
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
            }
        });

        for (var n=0; n<out.length; n++){
            item = out[n];
            mss = item.ms.sort(function(a, b){return a - b});
            if (hopNumber) {
                indentation = '      ';
                if (n == 0){
                    outString += hopNumber + indentation.substring(0, (indentation.length - ('' + hopNumber).length * 2));
                } else {
                    outString += indentation;
                }
            }
            outString += item.host + '  ';
            for (var m=0; m<mss.length; m++){
                outString += '  ' + mss[m] + ' ms';
            }
            outString += '\n';
        }

        return outString;
    };

    return Hop;
});