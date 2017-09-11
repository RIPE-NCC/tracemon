define([
    "tracemon.env.config"
], function(config) {

    var Measurement = function (id, target, interval) {
        this.id = id;
        this._traceroutes = [];
        this._traceroutesBySource = {};
        this.target = target;
        this.sources = {};
        this.interval = interval;
        this._longestTraceroute = null;
        this.isOneOff = (interval === null);
    };

    Measurement.prototype.empty = function(){
        this._traceroutes = [];
        this._traceroutesBySource = {};
        this._longestTraceroute = null;
    };

    Measurement.prototype._tracerouteSort = function(traceroute1, traceroute2){
        return traceroute1.date.unix() - traceroute2.date.unix();
    };

    Measurement.prototype.addTraceroutes = function(traceroutes){
        var isSetConsecutive;

        if (traceroutes.length > 0) {
            traceroutes = traceroutes.sort(this._tracerouteSort);
            isSetConsecutive = this._traceroutes && this._traceroutes.length > 0
                && this.getLastTraceroute().date.isBefore(traceroutes[0].date);


            if (isSetConsecutive) { // The two sets are sorted and consecutive
                this._traceroutes = this._traceroutes.concat(traceroutes);
                this._updateIndex(traceroutes); // Update index
            } else { // Ok, no optimisation, concat and sort everything
                this._traceroutes = this._traceroutes.concat(traceroutes);
                this._traceroutes.sort(this._tracerouteSort);
                this._createIndex(this._traceroutes); // Reset the index
            }
        }
    };

    Measurement.prototype.getTraceroutesBySource = function(sourceId){
        return this._traceroutesBySource[sourceId];
    };

    Measurement.prototype._createIndex = function(list){
        this._traceroutesBySource = {};
        this._updateIndex(list);
    };

    Measurement.prototype._updateIndex = function(list){
        var item, sourceId;

        for (var n=0,length=list.length; n<length; n++){
            item = list[n];
            item.measurement = this;
            sourceId = item.source.probeId;

            this._traceroutesBySource[sourceId] = this._traceroutesBySource[sourceId] || [];
            this._traceroutesBySource[sourceId].push(item);

            if (!this._longestTraceroute || item.getLength() > this._longestTraceroute.getLength()){
                this._longestTraceroute = item;
            }
        }
    };

    Measurement.prototype.getLastTraceroute = function(){
        return this._traceroutes[this._traceroutes.length - 1];
    };

    Measurement.prototype.getTraceroutes = function(){
        return this._traceroutes;
    };

    Measurement.prototype.getLongestTraceroute = function () {
        return this._longestTraceroute;
    };

    Measurement.prototype.getStateAt = function(date){
        var currentTraceroutes, traceroute, traceroutesForThisSource, validUpTo;

        currentTraceroutes = {};

        for (var source in this._traceroutesBySource){
            traceroutesForThisSource = this._traceroutesBySource[source]; // these are sorted for asc dates

            for (var n=0,length=traceroutesForThisSource.length; n<length; n++){
                traceroute = traceroutesForThisSource[n];

                if (traceroute.date.isSameOrBefore(date)){ // The last one before the date I want
                    currentTraceroutes[source] = traceroute;
                } else {
                    break;
                }

            }
        }

        for (var source in currentTraceroutes){
            traceroute = currentTraceroutes[source];

            if (!this.isOneOff && traceroute.validUpTo) {
                validUpTo = traceroute.validUpTo.unix() + Math.max(this.interval, config.minimumTracerouteValiditySeconds);

                if (validUpTo < date.unix()) {
                    delete currentTraceroutes[source];
                }
            }
        }

        return currentTraceroutes;
    };



    return Measurement;
});