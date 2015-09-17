define([
    "latencymon.env.config",
    "latencymon.env.utils"
], function(config, utils) {

    var TranslateToPing = function() {

        this.translate = function(sample){
            switch(sample.type){
                case "traceroute":
                    return this._fromTracerouteToPing(sample);
                    break;

                case "dns":
                    return this._fromDnsToPing(sample);
                    break;

                case "sslcert":
                    return this._fromSslToPing(sample);
                    break;

                case "http":
                    return this._fromHttpToPing(sample);
                    break;

                case "ping":
                    return sample;
                    break;

                default:
                    env.main.error("Not supported streamed sample type", "error");
            }
        };



        this._fromTracerouteToPing = function(sample){
            var pingSample, result, finalHop, finalHopAttempts, item;


            result = sample.result;
            finalHop = {"hop": 0, "result": []};
            finalHopAttempts = [];

            for (var currentHop in result) {
                if (result[currentHop]["hop"] > finalHop["hop"]) {
                    finalHop = result[currentHop];
                }
            }

            for (var n=0,length=finalHop["result"].length; n<length; n++){
                item = finalHop["result"][n];
                if (!item["x"] && item["rtt"]){
                    finalHopAttempts.push(item["rtt"]);
                }
            }
            finalHopAttempts.sort();

            pingSample = {
                "type": "traceroute",
                "prb_id": sample["prb_id"],
                "msm_id": sample["msm_id"],
                "timestamp": sample["timestamp"],
                "src_addr": sample["src_addr"],
                "dst_addr": sample["dst_addr"],
                "sent": finalHop["result"].length,
                "rcvd": finalHopAttempts.length,
                "min": null,
                "avg": null,
                "max": null
            };

            if (pingSample["rcvd"] > 2) {
                pingSample["max"] = finalHopAttempts[finalHopAttempts.length - 1];
                pingSample["avg"] = utils.median(finalHopAttempts);
                pingSample["min"] = finalHopAttempts[0];
            } else if (pingSample["rcvd"] == 2) {
                pingSample["max"] = finalHopAttempts[finalHopAttempts.length - 1];
                pingSample["min"] = finalHopAttempts[0];
            } else {
                pingSample["min"] = finalHopAttempts[0];
            }

            return pingSample;
        };


        this._fromSslToPing = function(sample){
            var pingSample;

            pingSample = {
                "type": "sslcert",
                "msm_id":    sample["msm_id"],
                "prb_id":    sample["prb_id"],
                "rcvd":      ((sample["rt"] != undefined) ? 1 : 0),
                "sent":      1,
                "timestamp": sample["timestamp"],
                "src_addr": sample["src_addr"],
                "dst_addr": sample["dst_addr"],
                "min": null,
                "avg": null,
                "max": null
            };


            if (pingSample["rcvd"] > 0) {
                pingSample["min"] = (sample["rt"]!= undefined) ? sample["rt"] : null;
            }

            return pingSample;
        };


        this._fromDnsToPing = function(sample){
            var pingSample;

            pingSample = {
                "type": "dns",
                "prb_id": sample["prb_id"],
                "msm_id": sample["msm_id"],
                "src_addr": sample["src_addr"],
                "dst_addr": sample["dst_addr"],
                "rcvd": ((sample["error"] != undefined) ? 0 : 1),
                "sent": 1,
                "timestamp": sample["timestamp"],
                "min": null,
                "avg": null,
                "max": null
            };

            if (pingSample["rcvd"] > 0) {
                pingSample["min"] = (sample["result"] && sample["result"]["rt"] != undefined) ? sample["result"]["rt"] : null;
            }

            return pingSample;
        };




        this._fromHttpToPing = function(sample){
            var pingSample, latencies, errors, item;

            latencies = [];
            errors = [];
            pingSample = {
                "type": "http",
                "prb_id": sample["prb_id"],
                "msm_id": sample["msm_id"],
                "src_addr": sample["src_addr"],
                "dst_addr": sample["dst_addr"],
                "rcvd": ((sample["result"] != undefined) ? sample["result"].length : 0),
                "sent": ((sample["result"] != undefined) ? Math.max(1, sample["result"].length) : 0),
                "timestamp": sample["timestamp"],
                "min": null,
                "avg": null,
                "max": null
            };



            for (var n=0,length=sample["result"].length; n<length; n++){
                item = sample["result"][n];

                if (item["rt"] != null && item["err"] == null){
                    latencies.push(item["rt"]);
                }

                if (item["err"] != null){
                    errors.push(item["err"]);
                }
            }

            latencies.sort();


            if (pingSample["rcvd"] > 2) {
                pingSample["max"] = latencies[latencies.length - 1];
                pingSample["avg"] = utils.median(latencies);
                pingSample["min"] = latencies[0];
            } else if (pingSample["rcvd"] == 2) {
                pingSample["max"] = latencies[latencies.length - 1];
                pingSample["min"] = latencies[0];
            } else {
                pingSample["min"] = latencies[0];
            }

            if (errors.length > 0){
                pingSample["errors"] = errors;
            }

            return pingSample;
        }
    };

    return new TranslateToPing();
});