
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
     "tracemon.lib.expression"
 ], function(Expression){

     var BooleanSearchHelper = function(env){

         this.search = function(searchKey){
            var expression, traceroutes, traceroute, results;

             results = [];
             expression = new Expression(searchKey);

             for (var msm in env.mainView.drawnStatus){
                 traceroutes = env.mainView.drawnStatus[msm];

                 for (var source in traceroutes){
                     traceroute = traceroutes[source];

                     if (expression.test(traceroute.getSingleLineString())){
                        results.push(traceroute);
                     }
                 }
             }

             return results;
         };

     };

     return BooleanSearchHelper;
 });