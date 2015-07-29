
define([
    "env.utils"
], function(utils) {

    var RelativeRTTFilter = function (env) {

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

                item.original = {
                    min: item.min,
                    avg: item.avg,
                    max: item.max
                };

                item.min = (item.min) ? ((item.min / minOfArray) * 100) - 100 : null;
                item.avg = (item.avg) ? ((item.avg / minOfArray) * 100) - 100 : null;
                item.max = (item.max) ? ((item.max / minOfArray) * 100) - 100 : null;
                dataOut.push(item);
            }

            return dataOut;
        };

    };

    return RelativeRTTFilter;
});