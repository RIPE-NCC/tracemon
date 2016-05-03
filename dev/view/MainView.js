
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.view.chart.hostView"
], function(utils, config, lang, $, HostView){

    var MainView = function(env){
        var $this;

        $this = this;
        this.hosts = {};
        this._oldStatus = {};


        this.graph = new dagreD3
            .graphlib
            .Graph({ multigraph: true })
            .setGraph({ "rankDir": "LR", "edgesep": 20 })
            .setDefaultEdgeLabel(function() { return {}; });

        this.setListeners = function(){
            utils.observer.subscribe("new-status", this.update, this);
        };


        this.update = function (newStatus){
            var diff;

            diff = this._computeDiff(this._oldStatus, newStatus);

            this._updateScene(diff);

            this._oldStatus = newStatus;
        };

        this._updateScene = function (diff) {

        };


        this._computeDiff = function(oldStatus, newStatus) {
            var out;

            out = {
                newTraceroutes: this._getNewTraceroutes(oldStatus, newStatus),
                updatedTraceroutes: this._getUpdatedTraceroutes(oldStatus, newStatus),
                deletedTraceroutes: this._getDeletedTraceroutes(oldStatus, newStatus)
            };

            return out;
        };

        this._getNewTraceroutes = function (oldStatus, newStatus){
            var newTraceroutes;

            newTraceroutes = [];

            for (var msmId in newStatus) {

                if (!oldStatus[msmId]) { // It is a new measurement, everything is new in it
                    for (var source in newStatus[msmId]) {
                        newTraceroutes.push(newStatus[msmId][source]);
                    }
                }
            }

            return newTraceroutes;
        };


        this._getUpdatedTraceroutes = function (oldStatus, newStatus){
            var updatedTraceroute;

            updatedTraceroute = [];
            for (var msmId in newStatus) {
                if (oldStatus[msmId]) { // It is an old measurement
                    for (var source in newStatus[msmId]) {
                        if (newStatus[msmId][source].getHash() != oldStatus[msmId][source].getHash()) {
                            updatedTraceroute.push(newStatus[msmId][source]);
                        }
                    }
                }
            }

            return updatedTraceroute;
        };



        this._getDeletedTraceroutes = function (oldStatus, newStatus){
            var deletedTraceroutes;

            deletedTraceroutes = [];

            for (var msmId in oldStatus) {

                if (!newStatus[msmId]) { // it has been deleted
                    for (var source in oldStatus[msmId]) {
                        deletedTraceroutes.push(oldStatus[msmId][source]);
                    }
                }
            }

            return deletedTraceroutes;
        };

        this.init = function(traceroutesList){
            // var traceroute, traceroutesGroup, hops, attempts, host;


            for (var host in this.hosts){
                this.hosts[host];

            }

            // for (var n=0,length=traceroutesList.length;n<length;n++){
            //     traceroutesGroup = traceroutesList[n];
            //     for (var source in traceroutesGroup){
            //         traceroute = traceroutesGroup[source];
            //         hops = traceroute.getHops();
            //         for (var n1=0,length1=hops.length;n1<length1;n1++){
            //             attempts = hops[n1].getAttempts();
            //             for (var n2=0,length2=attempts.length;n2<length2;n2++){
            //                 host = attempts[n2].host;
            //                 this.addHost(host);
            //             }
            //         }
            //     }
            // }
        };


        this.draw = function(){

        };

        this.addHost = function(host){
            try {
                $this.hosts[host.getId()] = new HostView(env, host, $this.graph);
                console.log("new host", host);
                // host.getAutonomousSystems()
                //     .done(function(){
                //         $this.hosts[host.getId()] = new HostView(env, host, $this.graph);
                //
                //     });
            } catch (e) {
            }
            // console.log("received", host);
        };

        this.addTraceroute = function(traceroute){
            var hops, attempts,host, lastHost;

            hops = traceroute.getHops();
            for (var n1=0,length1=hops.length;n1<length1;n1++){
                attempts = hops[n1].getAttempts();
                host = attempts[0].host; // PROBLEM: we are considering only the first attempt!!! <------
                if (lastHost){
                    this.graph.addEdge(lastHost.getId(), host.getId());
                }

                lastHost = host;
            }
        };


        this.setListeners();

    };


    return MainView;
});