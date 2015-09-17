
define([
    "latencymon.env.utils"
], function(utils) {

    var NaturalRTTFilter = function (env) {

        this.manipulate = function (data) {
            var dataOut, item;

            dataOut = [];
            for (var n = 0, length = data.length; n < length; n++) {
                item = utils.lightClone(data[n]);

                item.original = {
                    min: item.min,
                    avg: item.avg,
                    max: item.max
                };

                dataOut.push(item);
            }

            return dataOut;
        };

    };

    return NaturalRTTFilter;
});