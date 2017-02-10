
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


        this._historyTimelineSort = function(a, b){
            return a - b;
        };

        this._timestampToDate = function(timestamp){
            return moment.unix(timestamp);
        };

        this._dateToTimestamp = function(date){
            return date.unix();
        };

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
                    timestamp = this._dateToTimestamp(traceroutes[n].date);
                    if (this._historyTimeline.indexOf(timestamp) == -1){
                        this._historyTimeline.push(timestamp);
                        this.tmp[timestamp] = traceroutes[n];
                    }
                }
            }

            this._historyTimeline.sort(this._historyTimelineSort);

        };

        this.getTimeRange = function(){
            return {
                startDate: this._timestampToDate(this._historyTimeline[0]),
                stopDate: this._timestampToDate(this._historyTimeline[this._historyTimeline.length - 1])
            }
        };


        this.stopEmulation = function () {
            env.emulationRunning = false;
            console.log("emulation stopped");
            utils.observer.publish("view.animation:stop", env.finalQueryParams.instant);
        };

        this.emulateHistory = function(){
            env.emulationRunning = true;

            env.finalQueryParams.instant = env.finalQueryParams.startDate;
            utils.observer.publish("view.animation:start", env.finalQueryParams.instant);

            var emulate = function(){
                var history = [env.finalQueryParams.startDate.unix() + 1]
                    .concat($this._historyTimeline)
                    .concat([env.finalQueryParams.stopDate.unix()]);

                for (var n=0,length=history.length; n<length; n++){
                    var momentDate, timestamp;

                    timestamp = history[n];
                    momentDate = $this._timestampToDate(timestamp);

                    if (momentDate.isAfter(env.finalQueryParams.instant)){

                        env.finalQueryParams.instant = momentDate;
                        $this.getCurrentState();

                        utils.observer.publish("view.current-instant:change", env.finalQueryParams.instant);

                        if (env.emulationRunning) {
                            if (n == length - 1){
                                env.emulationRunning = false;
                                console.log("animation stop");
                                utils.observer.publish("view.animation:stop", env.finalQueryParams.instant);
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