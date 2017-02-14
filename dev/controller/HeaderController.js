
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
        var searchHelper, andSymbol, orSymbol, results;

        searchHelper = new SearchHelper(env);
        orSymbol = "OR";
        andSymbol = "AND";
        this.searchString = null;

        this._getSearchKey = function (searchArray) {
            return searchArray.join(' ' + orSymbol + ' ');
        };

        this.updateSearch = function () {
            var out, newSet, searchKey, traceroute;

            if (this.searchString) {
                out = {
                    in: {},
                    out: {}
                };

                searchKey = this._getSearchKey(this.searchString);
                newSet = env.mainView.getDrawnTraceroutes();
                for (var n = 0, length = newSet.length; n < length; n++) {

                    traceroute = newSet[n];
                    if (results.in[traceroute.id]) { // Check if still valid
                        out.in[traceroute.id] = traceroute;
                    } else if (results.out[traceroute.id]) {
                        out.out[traceroute.id] = traceroute;
                    } else {
                        results = searchHelper.search(searchKey, [traceroute]); // Check if it is in or out
                        if (results.in[traceroute.id]) { // Merge the results
                            out.in[traceroute.id] = traceroute;
                        } else if (results.out[traceroute.id]) {
                            out.out[traceroute.id] = traceroute;
                        }
                    }
                }
                results = out;
                return out;
            }

            return null;
        };

        this.search = function(searchString){

            this.searchString = searchString;
            results = (searchString) ? searchHelper.search(this._getSearchKey(this.searchString), env.mainView.getDrawnTraceroutes()) : null ;
            utils.observer.publish("view.traceroute.search:change", results);

            return results;
        };

        this.setMaxHop = function(maxHop){
            env.maxNumberHops = maxHop;
            env.main.updateData();
        };

    };

    return HeaderController;
});