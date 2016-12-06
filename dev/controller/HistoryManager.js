
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
        var $this, emulationPosition;

        $this = this;
        emulationPosition = null;
        this._historyTimeline = [];

        this.reset = function(){
            this._historyTimeline = [];
        };


        this.addMeasurement = function(measurement){
            var traceroutes;

            traceroutes = measurement.getTraceroutes();

            for (var n=0,length=traceroutes.length; n<length; n++){
                if (this._historyTimeline.indexOf(traceroutes[n]) == -1){
                    this._historyTimeline.push(traceroutes[n].date.unix());
                }
            }

        };

        this.getTimeRange = function(){
            return {
                startDate: this._historyTimeline[0],
                stopDate: this._historyTimeline[this._historyTimeline.length - 1]
            }
        };


        this.stopEmulation = function () {
            env.emulationRunning = false;
            console.log("emulation stopped");
            utils.observer.publish("view.animation:stop", emulationPosition);
        };

        this.emulateHistory = function(){
            env.emulationRunning = true;
            utils.observer.publish("view.animation:start", emulationPosition || $this._historyTimeline[0]);

            var emulate = function(){
                console.log("emulating");

                for (var n=0,length=$this._historyTimeline.length; n<length; n++){

                    if ($this._historyTimeline[n] > emulationPosition){
                        var date = moment.unix($this._historyTimeline[n]).utc();

                        $this.getStateAt(date);
                        utils.observer.publish("view.current-instant:change", date);

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

            this._historyTimeline = this._historyTimeline.sort();

            if (emulationPosition == null){
                emulationPosition = $this._historyTimeline[0];
            }

            if (env.emulationRunning){
                emulate();
            }
        };


        this.getLastState = function () {
            var out;

            out = {};
            for (var msmId in env.main.loadedMeasurements) {
                out[msmId] = env.main.loadedMeasurements[msmId].getLastState();
            }

            utils.observer.publish("view.status:change", out);

            return out;
        };

        this.getFirstState = function () {
            try {
                return this.getStateAt(this._historyTimeline[0]);
            } catch (e){
                console.log("Possible timeline empty", e);
            }
        };

        this.getStateAt = function(date){
            var out;

            out = {};
            for (var msmId in env.main.loadedMeasurements) {
                out[msmId] = env.main.loadedMeasurements[msmId].getStateAt(date);
            }
            emulationPosition = date;
            utils.observer.publish("view.status:change", out);

            return out;
        };

    };

    return HistoryManager;
});