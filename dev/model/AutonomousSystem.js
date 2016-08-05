define([
], function() {

    var AutonomousSystem = function (asn) {
        this.id = asn;
        this._hostsByKey = {};
        this._hosts = [];
        this._prefixes = [];
        this.owner = "";
    };

    AutonomousSystem.prototype.getPrefixes = function(){
        return this._prefixes;
    };

    AutonomousSystem.prototype.addPrefix = function(prefix){
        if (this._prefixes.indexOf(prefix) == -1){
            this._prefixes.push(prefix);
        }
    };
    

    AutonomousSystem.prototype.getHosts = function(){
        return this._hosts;
    };

    AutonomousSystem.prototype.getHost = function(id){
        return this._hostsByKey[id];
    };

    AutonomousSystem.prototype.addHost = function(host){
        if (!this._hostsByKey[host.getId()]){
            this._hostsByKey[host.getId()] = host;
            this._hosts.push(host);

            return true;
        }

        return false;
    };

    return AutonomousSystem;
});