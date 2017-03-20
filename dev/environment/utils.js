define([
    "tracemon.lib.date-format"
], function(){
    var locale, timeZoneOffset;

    timeZoneOffset = (new Date()).getTimezoneOffset();

    locale = {};
    /**
     * A collection of utilities
     */

    return {

        addMinutes: function (date, minutes) {
            return new Date(date.getTime() + (minutes * 60 * 1000));
        },

        subMinutes: function (date, minutes) {
            return new Date(date.getTime() - (minutes * 60 * 1000));
        },

        translate: function (pointsArray, vector) {
            var item, translatedArray;

            translatedArray = [];

            for (var n = 0, length = pointsArray.length; n < length; n++) {
                item = pointsArray[n];
                translatedArray.push({x: item.x + vector.x, y: item.y + vector.y});
            }
            return translatedArray;
        },

        computeColorScale: function (legend) {
            var mapOut, legendItem;

            mapOut = {valueRange: [], colorRange: []};

            for (var n = 0, length = legend.length; n < length; n++) {
                legendItem = legend[n];

                mapOut.valueRange = mapOut.valueRange.concat(legendItem.valueRange);
                mapOut.colorRange = mapOut.colorRange.concat(legendItem.colorRange);
            }
            return mapOut;
        },

        getLongestString: function (arrayOfStrings) {
            var maximum, item;

            maximum = -Infinity;
            for (var n = 0, length = arrayOfStrings.length; n < length; n++) {
                item = arrayOfStrings[n].length;

                if (maximum < item) {
                    maximum = item;
                }
            }

            return maximum;
        },

        writeSvgText: function (container, textArray, position, padding) {
            var textItem, actualPosition, interline, text;

            actualPosition = 0;
            interline = 15;

            container
                .selectAll("text")
                .remove();

            for (var n = 0, length = textArray.length; n < length; n++) {
                textItem = textArray[n];

                actualPosition = interline * n;

                container
                    .append("text")
                    .attr("class", "popup-text")
                    .attr("dx", position.x + padding.left)
                    .attr("dy", position.y + actualPosition + padding.top)
                    .text(textItem);
            }

            return text;
        },

        clone: function(obj){
            return JSON.parse(JSON.stringify(obj));
        },

        lightClone: function (toBeCloned) {
            var cloned, isArray;

            isArray = toBeCloned instanceof Array;

            if (isArray) {
                cloned = [];

                for (var n = 0, length = toBeCloned.length; n < length; n++) {
                    cloned.push(toBeCloned[n]);
                }

            } else {
                cloned = {};

                for (var item in toBeCloned) {
                    cloned[item] = toBeCloned[item];
                }
            }

            return cloned;
        },

        log: function (text, debug) {
            if (debug) {
                console.log(new Date(), text);
            }
        },

        getUrlParam: function (key) {
            var regex, result, match, url;

            url = document.location.search;
            regex = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi');
            result = [];

            while ((match = regex.exec(url)) != null) {
                result.push(match[1]);
            }
            return result;
        },

        indexOf: function (element, array) {
            var index = -1;

            if (array.indexOf) {
                index = array.indexOf(element);
            } else {

                for (var n = 0, length = array.length; n < length; n++) {
                    if (array[n] == element) {
                        index = n;
                        break;
                    }
                }
            }
            return index;
        },

        encapsulateDom: function (jQuerySelection) {
            return {$: jQuerySelection, plain: jQuerySelection[0]};
        },

        loadStylesheets: function (cssFiles, callback) {
            var cssRequested, stylesLoaded, cssListenerInterval, cssListenerTimeout, cssListener;

            stylesLoaded = document.styleSheets.length; // Initial css loaded
            cssRequested = cssFiles.length; // css to load

            for (var n=0; n<cssRequested; n++){ // load css
                this.loadCss(cssFiles[n]);
            }

            cssListenerInterval = 50; //50 ms
            cssListenerTimeout = 10000; // 10 secs
            cssListener = setInterval(function(){

                if(document.styleSheets.length >= stylesLoaded + cssRequested){ // check if all the css are loaded
                    clearInterval(cssListener);
                    callback();
                }else{
                    if (cssListenerTimeout <= 0){
                        clearInterval(cssListener);
                        console.log("It is not possible to load stylesheets.");
                    }
                    cssListenerTimeout -= cssListenerInterval;
                }
            }, cssListenerInterval);
        },

        loadCss: function (cssFile) {
            var newLink;

            newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.type = 'text/css';
            newLink.href = cssFile;
            newLink.async = true;
            (document.head || document.getElementsByTagName("head")[0]).appendChild(newLink);
        },

        getRectangularVertexPoints: function (x, y, width, height) {
            var leftTop, leftBottom, rightTop, rightBottom;

            leftTop = {x: x, y: y};
            leftBottom = {x: x, y: y + height};

            rightTop = {x: x + width, y: y};
            rightBottom = {x: x + width, y: y + height};

            return [leftTop, rightTop, rightBottom, leftBottom]; //returned clockwise
        },

        isThereAnIntersection: function (selectionVertices, cellVertices) {
            var a, b, c, d, e, f, g, h, thereIsAnIntersection,
                intersectionPoint;

            a = selectionVertices[0];
            b = selectionVertices[1];
            c = selectionVertices[2];
            d = selectionVertices[3];

            e = cellVertices[0];
            f = cellVertices[1];
            g = cellVertices[2];
            h = cellVertices[3];

            intersectionPoint = this.getLinesIntersection(a, b, e, h);

            function isPointInside(a, b, c, d, p) {
                return p.x >= a.x && p.x <= b.x && p.y >= a.y && p.y <= d.y;
            }

            // Don't declare the single items in dedicated vars in order to calculate them only if needed
            thereIsAnIntersection =
                isPointInside(e, f, g, h, a) || //Is It starting in a rect?
                isPointInside(a, b, c, d, this.getRectangleCenter(e, f, g, h)) ||
                isPointInside(a, b, c, d, e) ||
                isPointInside(a, b, c, d, h) ||
                isPointInside(a, b, c, d, g) ||
                isPointInside(a, b, c, d, f) ||
                isPointInside(e, f, g, h, c) || //Is it ending in a rect?
                (intersectionPoint != null);

            return thereIsAnIntersection;
        },

        getLinesIntersection: function (a, b, c, d) {

            /// "unroll" the objects
            var p0x = a.x,
                p0y = a.y,
                p1x = b.x,
                p1y = b.y,
                p2x = c.x,
                p2y = c.y,
                p3x = d.x,
                p3y = d.y,

            /// calc difference between the coords
                d1x = p1x - p0x,
                d1y = p1y - p0y,
                d2x = p3x - p2x,
                d2y = p3y - p2y,

            /// determinator
                d = d1x * d2y - d2x * d1y,

                px, py,
                s, t;

            /// if is not intersecting/is parallel then return immediately
            if (d == 0.0)
                return null;

            /// solve x and y for intersecting point
            px = p0x - p2x;
            py = p0y - p2y;

            s = (d1x * py - d1y * px) / d;
            if (s >= 0 && s <= 1) {

                /// if s was in range, calc t
                t = (d2x * py - d2y * px) / d;
                if (t >= 0 && t <= 1) {

                    return {x: p0x + (t * d1x),
                        y: p0y + (t * d1y)}
                }
            }

            return null;
        },

        getRectangleCenter: function (a, b, c, d) {
            var x, y;
            x = ((b.x - a.x) / 2) + a.x;
            y = ((d.y - a.y) / 2) + a.y;

            return {x: x, y: y};
        },

        join: function (array, char) {
            var stringOut = "";
            if (array.join) {
                stringOut = array.join(char);
            } else {

                for (var n = 0, length = array.length; n < length; n++) {
                    stringOut += array[n];
                    if (n != length - 1) {
                        stringOut += '' + char;
                    }
                }
            }

            return stringOut;
        },

        split: function (string, char, skipEmpty) {
            var arrayOut, item, tmp;

            arrayOut = string.split(char);

            if (skipEmpty) {

                tmp = [];

                for (var n = 0, length = arrayOut.length; n < length; n++) {
                    item = arrayOut[n];
                    if (item != '') {
                        tmp.push(item);
                    }
                }

                arrayOut = tmp;
            }

            return arrayOut;
        },

        logOnce: function (log) {
            if (!window.once) {
                window.once = true;
                this.log(log);
            }
        },

        reduceCalls: function (reductionId, reductionFactor) {
            var callNow;
            callNow = false;
            if (!window.reductionCallsCounters) {
                window.reductionCallsCounters = {};
            }

            if (window.reductionCallsCounters[reductionId] == null) {
                window.reductionCallsCounters[reductionId] = reductionFactor;
            }

            if (window.reductionCallsCounters[reductionId] == 0) {
                callNow = true;
                window.reductionCallsCounters[reductionId] = reductionFactor
            } else {
                window.reductionCallsCounters[reductionId]--;
            }

            return callNow;
        },

        getUTCDate: function(){
            return new Date(new Date().getTime() + (timeZoneOffset * 60 * 1000));
        },

        timestampToUTCDate: function (timestamp) {
            var date = new Date(timestamp * 1000);
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        },

        getInstanceSuffix: function (domName) {
            var suffix;

            suffix = domName.replace('.', '');
            suffix = suffix.replace('#', '');

            return suffix;
        },

        getUrlParameters: function (domName) { // Get a map composed of ALL the parameters
            var map, suffix, subElements, atLeastOne;

            map = {};
            atLeastOne = false;
            suffix = this.getInstanceSuffix(domName) + '.';

            window.location.search
                .replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {

                    key = key.toString().replace(suffix, ''); // Creates the map removing the suffix
                    if (key.indexOf('.') != -1) {
                        subElements = key.split('.');
                        if (!map[subElements[0]]) {
                            map[subElements[0]] = {};
                        }
                        map[subElements[0]][subElements[1]] = value;
                    } else {
                        map[key] = value;
                    }

                    atLeastOne = true;
                });

            return (atLeastOne) ? map : null;
        },

        mergeMaps: function (map1, map2) {
            var mapOut;

            mapOut = {};

            for (var key in map1) {
                mapOut[key] = map1[key];
            }

            for (var key in map2) {
                mapOut[key] = map2[key];
            }

            return mapOut;
        },

        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        dateToString: function (date) { //This is an indirection, may be useful in the future to manipulate dates
            return "" + date.getUTCFullYear() +
                "-" + ('0' + (date.getUTCMonth() + 1)).slice(-2) +
                "-" + ('0' + date.getUTCDate()).slice(-2) +
                " " + ('0' + date.getUTCHours()).slice(-2) +
                ":" + ('0' + date.getUTCMinutes()).slice(-2) +
                ":" + ('0' + date.getUTCSeconds()).slice(-2) +
                " UTC";
        },

        dateToStringShort: function (date) { //This is an indirection, may be useful in the future to manipulate dates
            return "" + date.getUTCFullYear() +
                "-" + ('0' + (date.getUTCMonth() + 1)).slice(-2) +
                "-" + ('0' + date.getUTCDate()).slice(-2) +
                " " + ('0' + date.getUTCHours()).slice(-2) +
                ":" + ('0' + date.getUTCMinutes()).slice(-2);
        },

        timestampToLocalDate: function (timestamp) {
            var date;
            date = new Date(timestamp * 1000);
            return date;
        },

        localDateToUTCDate: function (date) {
            var utcDate;

            utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

            return utcDate;
        },

        UTCDateToLocalDate: function (date) {
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
        },

        UTCDateToUTCTimestamp: function (date) {
            return parseInt(this.UTCDateToLocalDate(date).getTime()/1000);
        },

        callCallbacks: function (list, parameters) {
            var item;

            for (var n = 0, length = list.length; n < length; n++) {
                item = list[n];
                item.call(this, parameters);
            }
        },

        getCurrentUrl: function () {
            return window.location.href;
        },

        setParam: function (key, value, url) {
            var baseUrl, paramsUrl, pair, query, pairs, keyTmp, valueTmp, newPairs, inserted, questionMarkPosition,
                itemUrl, hash;

            hash = window.location.hash || "";
            newPairs = [];
            inserted = false;

            url = url.replace(hash, ""); // Remove hash

            if (url) {
                questionMarkPosition = url.indexOf('?');
                if (questionMarkPosition == -1) {
                    baseUrl = url;
                    paramsUrl = '';
                } else {
                    baseUrl = url.substring(0, questionMarkPosition);
                    paramsUrl = url.substring(questionMarkPosition + 1, url.length);
                }
            } else {
                baseUrl = '';
                paramsUrl = '';
            }

            pairs = paramsUrl.split('&');

            for (var n = 0, length = pairs.length; n < length; n++) {
                itemUrl = pairs[n];

                if (itemUrl != "") {
                    pair = (itemUrl).split('=');

                    keyTmp = pair[0];
                    valueTmp = pair[1];

                    if (keyTmp == key) {
                        if (value != null && value != '') {
                            newPairs.push(keyTmp + "=" + value);
                        }
                        inserted = true;
                    } else {
                        newPairs.push(keyTmp + "=" + valueTmp);
                    }
                }
            }

            if (!inserted) {
                if (value != null && value != "") {
                    newPairs.push(key + "=" + value);
                }
            }

            query = this.join(newPairs, '&');

            return baseUrl + '?' + query + hash;
        },

        containsAll: function (containerArray, containedArray) {
            var item;

            for (var n = 0, length = containedArray.length; n < length; n++) {
                item = containedArray[n];
                if (this.indexOf(item, containerArray) == -1) {
                    return false;
                }
            }

            return true;
        },

        objectSize: function (object) {
            var recurse, objectList, bytes;

            objectList = [];
            recurse = function (value) {
                bytes = 0;

                if (typeof value === 'boolean') {
                    bytes = 4;
                } else if (typeof value === 'string') {
                    bytes = value.length * 2;
                } else if (typeof value === 'number') {
                    bytes = 8;
                } else if (typeof value === 'object'
                    && objectList.indexOf(value) === -1) {
                    objectList[objectList.length] = value;
                    for (i in value) {
                        bytes += 8;
                        bytes += recurse(value[i]);
                    }
                }
                return bytes;
            };

            return recurse(object);
        },

        removeSubArray: function (mainArray, subArray) {
            var item, tmp;

            tmp = [];
            for (var n=0,length=mainArray.length; n<length; n++) {
                item = mainArray[n];
                if (subArray.indexOf(item) == -1){
                    tmp.push(item);
                }
            }

            return tmp;
        },

        validateIP: function(str){
            var ipv6TestRegEx, ipv4TestRegEx;

            ipv6TestRegEx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/;
            ipv4TestRegEx = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

            return ipv4TestRegEx.test(str) || ipv6TestRegEx.test(str);

//            return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(str);
        },

        isLocalStorageAvailable: function(){
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },

        getLocalData: function(key){
            var storedValue, storedExpiration;

            storedValue = localStorage[key];
            storedExpiration = localStorage['expirationDates-' + key];

            if (storedValue && (!storedExpiration || storedExpiration > (new Date()).getTime())){
                return storedValue;
            }

            return null;
        },

        setLocalData: function(key, data, expiration){
            try {

                localStorage[key] = data;
                localStorage['expirationDates-' + key] = expiration.getTime();

            } catch(error) {

                console.log('It was not possible to store the data: ' + error.toString());

                return false;
            }

            return true;
        },


        globalizeIfUndefined: function(what, where){
            for (var n=0,length=where.length; n<length; n++){
                if (typeof window[where[n]] == 'undefined'){
                    window[where[n]] = what;
                }
            }
        },


        getBrowserVersion: function(){

            if (!locale.browser) {
                locale.browser = (function () {
                    var userAgent, appName, matched, tem;
                    userAgent = navigator.userAgent;
                    appName = navigator.appName;
                    matched = userAgent.match(/(opera|chrome|safari|firefox|msie|trident|Windows Phone|BlackBerry|Opera Mini|IEMobile|iPhone|iPad|iPod|webOS|Android)\/?\s*([\d\.]+)/i) || [];
                    matched = matched[2] ? [matched[1], matched[2]] : [appName, navigator.appVersion, '-?'];
                    if (matched && (tem = userAgent.match(/version\/([\.\d]+)/i)) != null) matched[2] = tem[1];
                    return {name: matched[0], version: matched[1].split('.')};
                })();
            }

            return locale.browser;
        },


        logErrors: function(callback){
            if (callback){
                window.onerror = function errorUnwrapper(errorMsg, url, lineNumber) {
                    return callback("error", errorMsg + ' at ' + url + ' on line ' + lineNumber);
                }
            } else {
                window.onerror = null;
            }
        },

        clearObject: function(objToBeCleaned){
            for (var objKey in objToBeCleaned){
                objToBeCleaned[objKey] = null;
                delete objToBeCleaned[objKey];
            }
        },

        median: function(values) {
            values.sort(function(a,b) {return a - b;});
            var half;

            half = Math.floor(values.length / 2);

            if (values.length % 2) {
                return values[half];
            } else {
                return (values[half-1] + values[half]) / 2.0;
            }
        },

        htmlEncode: function(html){
            if (html === undefined || html === null){
                return html;
            } else {
                return html
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }
        },

        htmlDecode: function(string){
            return string
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
        },

        observer: {
            subscriptions: {},

            publish: function (event, obj){
                var callbacks, callback;

                callbacks = this.subscriptions[event] || [];
                for (var n=0,length=callbacks.length; n < length; n++){
                    callback = callbacks[n];
                    callback.callback.call(callback.context, obj);
                }
            },

            subscribe: function (eventName, callback, context){
                var events, event;

                events = (eventName.indexOf(",") != -1) ? [eventName] : eventName.split(",");

                for (var n=0,length=events.length; n<length; n++){
                    event = events[n];
                    if (!this.subscriptions[event]){
                        this.subscriptions[event] = [];
                    }
                    this.subscriptions[event].push({ callback: callback, context: context });
                }

            }
        },

        isPrivateIp: function(addr){
            // return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/
            //         .test(addr) ||
            //     /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/.test(addr) ||
            //     /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/
            //         .test(addr) ||
            //     /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(addr) ||
            //     /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/.test(addr) ||
            //     /^fc00:/i.test(addr) ||
            //     /^fe80:/i.test(addr) ||
            //     /^::1$/.test(addr) ||
            //     /^::$/.test(addr);

            var addressPieces;

            if (addr.indexOf('.') != -1 && addr.indexOf(':') == -1){ // IPv4
                addressPieces = addr.split(".");

                return (addressPieces[0] == 10) ||
                    (addressPieces[0] == 127) ||
                    (addressPieces[0] == 172 && addressPieces[1] >= 16 && addressPieces[1] <= 31) ||
                    (addressPieces[0] == 192 && addressPieces[1] == 168);

            } else { // IPv6
                addressPieces = addr.split(":");

                return (addressPieces[0].toLowerCase().indexOf("fd") == 0) ||
                    (addressPieces[0].toLowerCase().indexOf("fe80") == 0) ||
                    (addressPieces[0].toLowerCase().indexOf("fc00") == 0) ||
                    (addressPieces[0].toLowerCase().indexOf("fc00") == 0) ||
                    (addr == "::1") ||
                    (addr == "::");

            }
        },

        getIdFromIp: function(ip){
            ip = ip.replace(/\./g, "-");
            ip = ip.replace(/\:/g, "-");
            ip = ip.replace(/\*/g, "");

            return ip;
        },

        arrayUnique: function(values){
            var u = {}, a = [];
            for(var i = 0, l = values.length; i < l; ++i){
                if(u.hasOwnProperty(values[i])) {
                    continue;
                }
                a.push(values[i]);
                u[values[i]] = 1;
            }
            return a;
        },

        rotate: function(center, point, angle){
            var radians = (Math.PI / 180) * angle,
                cos = Math.cos(radians),
                sin = Math.sin(radians),
                nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x,
                ny = (cos * (point.y - center.y)) - (sin * (point.x - center.x)) + center.y;

            return { x: nx, y: ny };
        },

        hash: function(str) {
            var hash = 0, i, chr, len;
            if (str.length === 0) return hash;
            for (i = 0, len = str.length; i < len; i++) {
                chr   = str.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
    }
});