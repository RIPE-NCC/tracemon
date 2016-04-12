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
    };


    Hop.prototype.addAttempt = function(attempt){
        this._attempts.push(attempt);
    };

    Hop.prototype.getAttempts = function(){
        return this._attempts;
    };

    return Hop;
});