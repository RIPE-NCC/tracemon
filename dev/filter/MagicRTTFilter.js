
define([
    "latencymon.env.utils"
], function(utils) {

    var MagicRTTFilter = function (env) {

        this.manipulate = function (data) {
            var dataOut, minOfArray, item, n, length;

            dataOut = [];
            minOfArray = Infinity;

            for (n = 0, length = data.length; n < length; n++) {
                item = data[n];
                if (item.min) {
                    minOfArray = Math.min(item.min, minOfArray);
                }
            }



            for (n = 0, length = data.length; n < length; n++) {
                item = utils.lightClone(data[n]);
                item.min = (item.min) ? ((item.min / minOfArray) * 100) - 99 : null;
                item.avg = (item.avg) ? ((item.avg / minOfArray) * 100) - 99 : null;
                item.max = (item.max) ? ((item.max / minOfArray) * 100) - 99 : null;
                dataOut.push(item);
            }

            return dataOut;
        };

    };

    return MagicRTTFilter;
});