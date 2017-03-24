define([
], function(){

    var SourcesSelectionHelper = function(env){

        this.getInitialSourcesSelection = function(amount){

            if (Object.keys(env.loadedMeasurements).length == 1){
                return this._getInitialAmount(amount);
            } else {
                return this._equallyDistributedMeasurements(amount);
            }
        };


        this._equallyDistributedMeasurements = function(amount){
            var splitAmount, sourcesOut, sources;

            sourcesOut = [];
            splitAmount = amount / Object.keys(env.loadedMeasurements).length;

            for (var msmId in env.loadedMeasurements){
                sources = env.loadedMeasurements[msmId].sources;
                if (Object.keys(sources).length > 0) {
                    sourcesOut = sourcesOut.concat(this._getInitialAmount(splitAmount, sources));
                }
            }

            return sourcesOut;
        };

        this._getInitialAmount = function(amount, sources){
            var out;

            out = [];
            sources = sources || env.loadedSources;
            for (var probeKey in sources){
                out.push(parseInt(probeKey));
                if (out.length == amount){
                    break;
                }
            }

            return out;
        };

    };

    return SourcesSelectionHelper;
});