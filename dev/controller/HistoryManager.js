
/*
 * Copyright (c) 2016 RIPE NCC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */


define([
    "tracemon.env.config",
    "tracemon.env.utils",
    "tracemon.lib.moment"
], function(config, utils, moment){

    var HistoryManager = function(env){
        var $this, previousInstant;

        $this = this;
        this._historyTimeline = [];
        previousInstant = null;


        this._setListeners = function(){
            utils.observer.subscribe("model.history:new", this.updateIndex, this);
            utils.observer.subscribe("model.history:change", this.updateIndex, this);
        };

        this.reset = function(){
            this._historyTimeline = [];
        };

        this.updateIndex = function(){
            var traceroutes, timestamp, measurement;

            for (var msm in env.loadedMeasurements){
                measurement = env.loadedMeasurements[msm];

                traceroutes = measurement.getTraceroutes();
                this.tmp = {};
                for (var n=0,length=traceroutes.length; n<length; n++){
                    timestamp = traceroutes[n].date.unix();
                    if (this._historyTimeline.indexOf(timestamp) == -1){
                        this._historyTimeline.push(timestamp);
                        this.tmp[timestamp] = traceroutes[n];
                    }
                }

            }

        };

        this.getTimeRange = function(){
            return {
                startDate: moment.unix(this._historyTimeline[0]).utc(),
                stopDate: moment.unix(this._historyTimeline[this._historyTimeline.length - 1]).utc()
            }
        };


        this.stopEmulation = function () {
            env.emulationRunning = false;
            console.log("emulation stopped");
            utils.observer.publish("view.animation:stop", env.currentInstant);
        };

        this.emulateHistory = function(){
            env.emulationRunning = true;

            this._historyTimeline = this._historyTimeline.sort();
            env.currentInstant = moment.unix($this._historyTimeline[0]).utc();
            utils.observer.publish("view.animation:start", env.currentInstant);

            var emulate = function(){

                for (var n=0,length=$this._historyTimeline.length; n<length; n++){
                    var momentDate, timestamp;

                    timestamp = $this._historyTimeline[n];
                    momentDate = moment.unix(timestamp).utc();

                    if (momentDate > env.currentInstant){

                        $this.getStateAt(momentDate);
                        console.log("showing: ", timestamp,  $this.tmp[timestamp].getHash());
                        utils.observer.publish("view.current-instant:change", momentDate);

                        if (env.emulationRunning) {
                            if (n == length - 1){
                                env.emulationRunning = false;
                                console.log("animation stop");
                                utils.observer.publish("view.animation:stop", $this._historyTimeline[n]);
                            } else {
                                setTimeout(emulate, env.historyEmulationEventDuration);
                            }
                        }

                        break;
                    }
                }

            };

            emulate();

        };

        // this.getLastState = function () {
        //     var out, date, measurement, lastTraceroute;
        //
        //     out = {};
        //     for (var msmId in env.loadedMeasurements) {
        //         measurement = env.loadedMeasurements[msmId];
        //         out[msmId] = measurement.getLastState();
        //         lastTraceroute = measurement.getLastTraceroute();
        //         if (lastTraceroute) {
        //             date = (!date && lastTraceroute) ? lastTraceroute.date : moment().max(lastTraceroute.date, date);
        //         }
        //     }
        //
        //     env.currentInstant = date;
        //     this.currentState = out;
        //
        //     utils.observer.publish("view.status:change", out);
        //
        //     return out;
        // };

        // this.getFirstState = function () {
        //     if (this._historyTimeline.length > 0){
        //         return this.getStateAt(moment.unix(this._historyTimeline[0]).utc());
        //     } else {
        //         throw "The history is empty";
        //     }
        // };

        this.getCurrentState = function(){
            return this._getStateAt(env.finalQueryParams.instant);
        };

        this._getStateAt = function(date){
            var out;

            if ((env.metaData.startDate.isSameOrBefore(date))
                && (!env.metaData.stopDate || env.metaData.stopDate.isSameOrAfter(date))){
                out = {};
                for (var msmId in env.loadedMeasurements) {
                    out[msmId] = env.loadedMeasurements[msmId].getStateAt(date);
                }

                if (!previousInstant || !previousInstant.isSame(date)) {
                    utils.observer.publish("view.status:change", out);
                }

                previousInstant = date;
            } else {
                throw "The selected instant is out of the measurement lifespan";
            }


            return out;
        };


        this._setListeners();
    };

    return HistoryManager;
});