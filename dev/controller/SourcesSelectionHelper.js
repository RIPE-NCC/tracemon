 define([
 ], function(){

     var SourcesSelectionHelper = function(env){

         this.getInitialSourcesSelection = function(amount){
             var out;

             out = [];

             for (var probeKey in env.loadedSources){
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