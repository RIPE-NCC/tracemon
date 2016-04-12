
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

        this.setListeners = function(){
            utils.observer.subscribe("new-host", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);
            //env.observer.subscribe("", this.addHost, this);

        };


        this.init = function(){

        };


        this.draw = function(){

        };

        this.addHost = function(host){
            try{
                host.getAutonomousSystems()
                    .done(function(){
                        $this.hosts[host.getId()] = new HostView(env, host);

                    });
            } catch (e) {
            }
            // console.log("received", host);
        };


        this.setListeners();

    };


    return MainView;
});