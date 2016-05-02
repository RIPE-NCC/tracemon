
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
            // utils.observer.subscribe("new-measurement", this.addMeasurement, this);
            // utils.observer.subscribe("new-traceroute", this.addTraceroute, this);
            // utils.observer.subscribe("new-host", this.addHost, this);
            utils.observer.subscribe("new-status", this.update, this);
            //env.observer.subscribe("", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);

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
            var newTraceroutes, updatedTraceroutes, deletedTraceroutes, out;

            out = {

            };

            return out;
        };

        this._getNewTraceroutes = function (status){
            
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