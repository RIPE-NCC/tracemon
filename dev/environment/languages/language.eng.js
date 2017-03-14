/**
 * Created by mcandela on 23/01/14.
 */


define([], function(){
    return {
        latency: "Latency",
        traceroutesDontReach: "Some traceroutes don't reach the target",
        allTraceroutesDontReach: "All the traceroutes don't reach the target",
        title: "Traceroute Visualisation (BETA)",
        hostGroupedBy: "Hosts grouped by",
        loadingMessage: "Loading...",
        
        labelOptions: {
          ip: "IP address",
          reverseLookup: "Reverse lookup",
          country: "Country code"
        },

        views: {
            host: "IP",
            asn: "Autonomous System",
            country: "Country"
        }
    }
});