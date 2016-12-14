/**
 * Copyright 2014 - mcandela
 * Date: 04/09/14
 * Time: 23:25
 */

define([
    "tracemon.env.config",
    "tracemon.lib.socket-io"
], function(config, io) {


    var LiveConnector = function (env) {
        var socket, callback, context;

        this.init = function(){
            socket = io(config.streamingUrl, { path : "/stream/socket.io" });
            socket.on("atlas_result", function(result){
                if (callback){
                    callback.call(context, result);
                }
            });

            socket.on("atlas_error", function(result) {
                console.log(result); // For now, after propagate bubbling up
            });
        };


        this.subscribe = function(filtering, callbackA, contextA) {
            callback = callbackA;
            context = contextA;
            socket.emit("atlas_subscribe", filtering); // possible: type, prb, msm, sourceAddress, sourcePrefix, destinationAddress, destinationPrefix
        };


        if (env.realTimeUpdate) {
            this.init();
        }

        window.debugFakeSample = function(ip){
            var timestamp = parseInt(new Date().getTime()/1000);
            callback([{"lts":171,"group_id":4471092,"src_addr":"192.168.0.2","msm_id":4471092,"fw":4730,"timestamp":timestamp,"proto":"ICMP","dst_name":"186.226.68.106","paris_id":1,"prb_id":938,"af":4,"result":[{"result":[{"rtt":1.963,"size":76,"from":"192.168.0.1","ttl":64},{"rtt":1.796,"size":76,"from":"192.168.0.1","ttl":64},{"rtt":2.324,"size":76,"from":"192.168.0.1","ttl":64}],"hop":1},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":2},{"result":[{"size":140,"rtt":112.014,"icmpext":{"obj":[{"mpls":[{"s":1,"ttl":1,"exp":0,"label":347296}],"type":1,"class":1}],"version":2,"rfc4884":0},"from": ip,"ttl":246},{"size":140,"rtt":112.827,"icmpext":{"obj":[{"mpls":[{"s":1,"ttl":1,"exp":0,"label":347296}],"type":1,"class":1}],"version":2,"rfc4884":0},"from":"84.116.228.173","ttl":246},{"size":140,"rtt":107.042,"icmpext":{"obj":[{"mpls":[{"s":1,"ttl":1,"exp":0,"label":347296}],"type":1,"class":1}],"version":2,"rfc4884":0},"from":"84.116.228.173","ttl":246}],"hop":3},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":4},{"result":[{"size":140,"rtt":110.843,"icmpext":{"obj":[{"mpls":[{"s":1,"ttl":1,"exp":0,"label":317504}],"type":1,"class":1}],"version":2,"rfc4884":0},"from":"84.116.140.170","ttl":251},{"size":140,"rtt":106.785,"icmpext":{"obj":[{"mpls":[{"s":1,"ttl":1,"exp":0,"label":317504}],"type":1,"class":1}],"version":2,"rfc4884":0},"from":"84.116.140.170","ttl":251},{"size":140,"rtt":116.13,"icmpext":{"obj":[{"mpls":[{"s":1,"ttl":1,"exp":0,"label":317504}],"type":1,"class":1}],"version":2,"rfc4884":0},"from":"84.116.140.170","ttl":251}],"hop":5},{"result":[{"rtt":130.774,"size":28,"from":"84.116.137.194","ttl":250},{"rtt":106.553,"size":28,"from":"84.116.137.194","ttl":250},{"rtt":111.146,"size":28,"from":"84.116.137.194","ttl":250}],"hop":6},{"result":[{"rtt":129.899,"size":76,"from":"4.68.72.9","ttl":58},{"rtt":128.194,"size":76,"from":"4.68.72.9","ttl":58},{"rtt":107.357,"size":76,"from":"4.68.72.9","ttl":58}],"hop":7},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":8},{"result":[{"rtt":110.013,"size":28,"from":"4.68.63.170","ttl":247},{"rtt":109.577,"size":28,"from":"4.68.63.170","ttl":247},{"rtt":105.951,"size":28,"from":"4.68.63.170","ttl":247}],"hop":9},{"result":[{"rtt":230.696,"size":28,"from":"67.16.156.78","ttl":243},{"rtt":240.533,"size":28,"from":"67.16.156.78","ttl":243},{"rtt":230.812,"size":28,"from":"67.16.156.78","ttl":243}],"hop":10},{"result":[{"rtt":230.621,"size":28,"from":"189.125.13.154","ttl":243},{"rtt":235.091,"size":28,"from":"189.125.13.154","ttl":243},{"rtt":230.916,"size":28,"from":"189.125.13.154","ttl":243}],"hop":11},{"result":[{"rtt":243.491,"size":28,"from":"186.226.80.101","ttl":243},{"rtt":245.667,"size":28,"from":"186.226.80.101","ttl":243},{"rtt":245.815,"size":28,"from":"186.226.80.101","ttl":243}],"hop":12},{"result":[{"rtt":275.253,"size":28,"from":"186.226.80.122","ttl":243},{"rtt":280.216,"size":28,"from":"186.226.80.122","ttl":243},{"rtt":275.595,"size":28,"from":"186.226.80.122","ttl":243}],"hop":13},{"result":[{"rtt":260.37,"size":28,"from":"189.50.127.1","ttl":243},{"rtt":260.304,"size":28,"from":"189.50.127.1","ttl":243},{"rtt":260.42,"size":28,"from":"189.50.127.1","ttl":243}],"hop":14},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":15},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":16},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":17},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":18},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":19},{"result":[{"x":"*"},{"x":"*"},{"x":"*"}],"hop":255}],"dst_addr":"186.226.68.106","from":"80.110.115.45","endtime":1469630184,"type":"traceroute","msm_name":"Traceroute","size":48}]);
        };

    };

    return LiveConnector;
});