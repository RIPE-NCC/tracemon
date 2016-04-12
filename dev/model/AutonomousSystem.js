define([
], function() {

    var AutonomousSystem = function (asn, owner) {
        this.id = asn;
        this._owner = owner;
        this._hostsByKey = {};
        this._hosts = [];
        this._prefixes = [];
    };

    AutonomousSystem.prototype.getPrefixes = function(){
        return this._prefixes;
    };

    AutonomousSystem.prototype.addPrefix = function(prefix){
        if (this._prefixes.indexOf(prefix) == -1){
            this._prefixes.push(prefix);
        }
    };

    AutonomousSystem.prototype.getOwner = function(){
        return this._owner;
    };

    AutonomousSystem.prototype.getHosts = function(){
        return this._hosts;
    };

    AutonomousSystem.prototype.getHost = function(id){
        return this._hostsByKey[id];
    };

    AutonomousSystem.prototype.addHost = function(host){
        if (!this._hostsByKey[host.id]){
            this._hostsByKey[host.id] = host;
            this._hosts.push(host);

            return true;
        }

        return false;
    };

    return AutonomousSystem;
});