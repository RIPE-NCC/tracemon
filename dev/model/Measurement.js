define([
    "tracemon.env.utils"
], function(utils) {

    var Measurement = function (id, target) {
        this.id = id;
        this._traceroutes = [];
        this._traceroutesBySource = {};
        this._traceroutesByTimeRange = [];
        this.target = target;

        this._tracerouteSort = function(traceroute1, traceroute2){
            return traceroute1.date - traceroute2.date;
        };

    };



    Measurement.prototype.addTraceroutes = function(traceroutes){
        var isSetConsecutive;

        traceroutes = traceroutes.sort(this._tracerouteSort);
        isSetConsecutive = this._traceroutes && this._traceroutes.length > 0
            && this._traceroutes[this._traceroutes.length - 1].date > traceroutes[0].date;


        if (isSetConsecutive){ // The two sets are sorted and consecutive
            this._traceroutes = this._traceroutes.concat(traceroutes);
            this._updateIndex(traceroutes); // Update index
        } else { // Ok, no optimisation, concat and sort everything
            this._traceroutes = this._traceroutes
                .concat(traceroutes)
                .sort(this._tracerouteSort);
            this._createIndex(this._traceroutes); // Reset the index
        }
    };

    Measurement.prototype._createIndex = function(list){
        this._traceroutesBySource = {};
        this._updateIndex(list);
    };

    Measurement.prototype._updateIndex = function(list){
        var item;

        for (var n=0,length=list.length; n<length; n++){
            item = list[n];

            this._traceroutesBySource[item.source.probeId] = this._traceroutesBySource[item.source.probeId] || [];
            this._traceroutesBySource[item.source.probeId].push(item);
        }
    };

    Measurement.prototype.getLastState = function(){
        var traceroutesForThisSource, out, lastItem;

        out = {};
        for (var source in this._traceroutesBySource){
            traceroutesForThisSource = this._traceroutesBySource[source];
            lastItem = traceroutesForThisSource[traceroutesForThisSource.length - 1];
            out[source] = lastItem;
        }


        return out;
    };

    Measurement.prototype.getTraceroutes = function(){
        return this._traceroutes;
    };

    Measurement.prototype.getStateAt = function(date){
        var currentTraceroutes, traceroute, traceroutesForThisSource;

        currentTraceroutes = {};
        for (var source in this._traceroutesBySource){
            traceroutesForThisSource = this._traceroutesBySource[source];

            for (var n=0,length=traceroutesForThisSource.length; n<length; n++){
                traceroute = traceroutesForThisSource[n];
                currentTraceroutes[source] = traceroute; // Will be replaced by the next one as long as date < traceroute.date

                if (traceroute.date > date){ // Last traceroute found
                    break; // Move to the next source
                }
            }
        }

        return currentTraceroutes;
    };



    return Measurement;
});