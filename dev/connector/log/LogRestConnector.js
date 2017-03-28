
define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd"
], function(config, $){

    /**
     * Connector is in charge of connecting the data-apis and providing a JSON format to the layers over.
     *
     * @class LogRestConnector
     * @constructor
     * @module connector.log-connector
     */

    var LogRestConnector = function(env){
        var logStorageUrl, errorStorageUrl, appTag;

        logStorageUrl = config.dataAPIs.storageLogRestApiUrl;
        errorStorageUrl = config.dataAPIs.storageErrorRestApiUrl;

        appTag = config.logAppTag;

        /**
         * Sends logs to the servers
         *
         *
         * @method log
         * @param {String} type The type of the log
         * @param {String} log The body of the log
         */

        this.log = function(type, log){
            this._persist(logStorageUrl, this._createJson(type, log));
        };


        /**
         * Sends errors to the servers
         *
         *
         * @method error
         * @param {String} type The type of the error
         * @param {String} error The body of the error
         */

        this.error = function(type, error){
            this._persist(errorStorageUrl, this._createJson(type, error));
        };


        /**
         * This method creates a json version of a log entry
         *
         *
         * @method _createJson
         * @private
         * @param {String} type The type of the error
         * @param {String} log The body of the error
         */

        this._createJson = function(type, log){
            return {app: appTag, type: type, log: log, origin: window.location.href };
        };


        /**
         * This method handles the ajax call to POST the error to the server
         *
         *
         * @method _persist
         * @private
         * @param {String} url The type of the error
         * @param {String} json The body of the error
         */

        this._persist = function(url, json){
            var xhr;

            try {

                xhr = $.ajax({
                    type: "POST",
                    url: url,
                    data: json,
                    crossDomain: true,
                    dataType: 'json'
                });

                if (xhr && xhr.readyState>3 && xhr.readyState<4) {
                    xhr.abort();
                }

            } catch(error) {
            }
        };

    };


    return LogRestConnector;
});