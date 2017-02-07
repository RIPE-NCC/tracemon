 define([
 ], function(){

     var SourcesSelectionHelper = function(env){

         this.getInitialSourcesSelection = function(){
             var out;

             out = [];
             for (var probeKey in env.loadedSources){
                 out.push(parseInt(probeKey));
                 if (out.length == env.queryParams.numberOfProbes){
                     break;
                 }
             }

             return out;
         };

     };

     return SourcesSelectionHelper;
 });