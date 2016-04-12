define([
    "tracemon.env.utils"
], function(utils) {

    var Facade = function () {

        this.autonomousSystems = {};
        this.hosts = {};
        this.measurements = {};
        this.traceroutes = [];
        this.currentTraceroutes = {};


        this.addMeasurement = function(measurement){
            if (!this.measurements[measurement.id]){
                this.measurements[measurement.id] = measurement;
                utils.observer.publish("new-measurement", measurement);
            } else {
                throw "Duplicate Measurement";
            }
        };


        this.getMeasurement = function(measurement){
            if (this.measurements[measurement.id]){
                return this.measurements[measurement.id];
            } else {
                throw "Measurement not present";
            }
        };



        this.addAutonomousSystem = function(autonomousSystem){
            if (!this.autonomousSystems[autonomousSystem.id]){
                this.autonomousSystems[autonomousSystem.id] = autonomousSystem;
            } else {
                throw "Duplicate Autonomous System";
            }
        };


        this.getAutonomousSystem = function(autonomousSystem){
            if (this.autonomousSystems[autonomousSystem.id]){
                return this.autonomousSystems[autonomousSystem.id];
            } else {
                throw "Autonomous System not present";
            }
        };



        this.addHost = function(host){
            if (!this.hosts[host.id]){
                this.hosts[host.id] = host;
                utils.observer.publish("new-host", host);
            } else {
                throw "Duplicate Host";
            }
        };


        this.getHost = function(id){
            if (this.hosts[id]){
                return this.hosts[id];
            } else {
                throw "Host not present";
            }
        };




        this.addTraceroute = function(measurementId, traceroute){
            var hops, hop, attempts, attempt, measurement;

            measurement = this.measurements[measurementId];

            if (!measurement){
                throw "Measurement not defined";
            }

            measurement.addTraceroute(traceroute);
            hops = traceroute.getHops();
            this.traceroutes.push(traceroute);

            for (var n=0,length=hops.length; n<length; n++){
                hop = hops[n];

                attempts = hop.getAttempts();
                for (var n2=0,length2=attempts.length; n2<length2; n2++){
                    attempt = attempts[n2];

                    if (this.hosts[attempt.host.id]){
                        throw "Autonomous System " + attempt.host.id + " not part of the model";
                    }

                    this.hosts[attempt.host.id] = attempt.host;
                    if (!this.autonomousSystems[attempt.host.autonomousSystem.id]){
                        throw "Autonomous System " + attempt.host.autonomousSystem.id + " not part of the model";
                    }
                    this.autonomousSystems[attempt.host.autonomousSystem.id].addHost(attempt.host);

                }
            }

        };



    };


    return Facade;
});