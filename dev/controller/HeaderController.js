
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
    "tracemon.controller.boolean-search"
], function(config, utils, SearchHelper){

    var HeaderController = function(env){
        var searchHelper, andSymbol, orSymbol;

        searchHelper = new SearchHelper(env);
        orSymbol = "OR";
        andSymbol = "AND";

        this._getSearchKey = function (searchArray) {
            return searchArray.join(' ' + orSymbol + ' ');
        };

        this.search = function(searchString){
            var results;

            results = [];
            if (searchString) {
                results = searchHelper.search(this._getSearchKey(searchString));

                for (var n=0,length=results.length; n<length; n++) {
                    utils.observer.publish("traceroute-selected", results[n]);
                }
            }

            return results;
        };

        this.setMaxHop = function(maxHop){
            env.maxNumberHops = maxHop;
            env.main.updateCurrentData();
        };

        this.setReplaySpeed = function(speed){
            env.historyEmulationEventDuration = (speed/2) * 1000
        };
    };

    return HeaderController;
});