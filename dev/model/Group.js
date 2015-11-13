define([
    "latencymon.lib.jquery-amd"
], function($) {

    var Group = function (measurementID, id) {
        var stringDescription;

        this.probes = [];
        this.id = id;
        this.measurementId = measurementID;

        this.addProbe = function(probe){
            this.probes.push(probe);
            stringDescription = this._computeToString(); // Update the description
        };


        this.removeProbe = function(probe){
            var tmpProbes;

            tmpProbes = [];
            if (this.probes.length > 1) {
                for (var n = 0, length = this.probes.length; n < length; n++) {
                    if (this.probes[n].id != probe.id) {
                        tmpProbes.push(this.probes[n]);
                    }
                }

                this.probes = tmpProbes;
                stringDescription = this._computeToString(); // Update the description

            } else {
                env.main.error("A group must have at least a probe", "error");
            }

        };


        this.forEach = function(callback, context){
            for (var n=0, length=this.probes.length; n<length;n++){
                callback.call(context, this.probes[n]);
            }
        };

        this.contains = function(probe){
            for (var n=0, length=this.probes.length; n<length; n++){
                if (this.probes[n].id == probe.id){
                    return true;
                }
            }

            return false;
        };

        this.toString = function(){
            if (!stringDescription){ // Optimisation
                stringDescription = this._computeToString();
            }
            return stringDescription;
        };

        this._computeToString = function(){
            return $.map(this.probes, function(probe){return probe.id}).join(", ");
        }

    };

    return Group;
});