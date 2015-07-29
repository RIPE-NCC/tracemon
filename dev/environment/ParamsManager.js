/**
 * Created by mcandela on 11/12/13.
 */

define([
    "env.utils"
], function(utils){

    /**
     * ParamsManager is the only component aware about the translation between external and internal parameters.
     * It allows to have high-level internal parameters expressed as visualisation terms and external domain related
     * parameters. This approach allows to easily introduce at any time new "views" based on different data elements
     * using the same graphic metaphor.
     *
     * @class ParamsManager
     * @constructor
     * @module environment
     */

    var ParamsManager = function(){


        /**
         * This method merges two parameters vectors
         *
         * @method mergeParams
         * @input {Object} actualParams A vector of parameters
         * @input {Object} newParams A vector of parameters
         * @return {Object} A vector of parameters
         */

        this.mergeParams = function(actualParams, newParams){
            for (var paramKey in newParams){ // MAP not Array
                actualParams[paramKey] = newParams[paramKey];
            }

            return actualParams;
        };


        /**
         * This method converts the parameters vector from the external to the internal format.
         * It is an indirection layer able to converts parameters from an external domain to a graphical domain
         * stopping at the same time the propagation of changes involving the external parameters.
         *
         * @method fromExternalToInternal
         * @input {Object} params A vector of parameters
         * @return {Object} A vector of parameters
         */

        this.fromExternalToInternal = function(params){
            var zone, server, type, startDate, selectedRows, outParams, endDate, zoneName, serverName, typeName,
                startDateName, endDateName, selectedRowsName, isTcp, ipVersion, isTcpName, ipVersionName, validatorMap,
                timeWindowName, timeWindow, filterProbesName, filterProbes;

            zoneName = "zone";
            serverName = "server";
            typeName = "type";
            startDateName = "startTime";
            endDateName = "endTime";
            selectedRowsName = "selectedRows";
            isTcpName = "isTcp";
            ipVersionName = "ipVersion";
            timeWindowName = "defaultTimeWindow";
            filterProbesName = "filterProbes";

            validatorMap = {
                "zone": {
                    type: "string"
                },

                "server": {
                    type: "string"
                },

                "type": {
                    type: function(val){ return (val == "zone-servers" || val == "server-probes" || val == "server-instances");},
                    message: "The type param can be one of 'zone-servers', 'server-probes' or 'server-instances'"
                },

                "startTime": {
                    type: "number",
                    cast: function(val){ return ((typeof val == "string") ? parseInt(val) : val); }, // This is a cast for multiple types input
                    message: "startTime it is not a valid Unix timestamp"
                },

                "endTime": {
                    type: "number",
                    cast: function(val){ return ((typeof val == "string") ? parseInt(val) : val); }, // This is a cast for multiple types input
                    message: "endTime it is not a valid Unix timestamp"
                },

                "selectedRows": {
                    type: "string",
                    message: "The selectedRows params must be a list of comma-separated ids"
                },

                "ipVersion": {
                    type: function(val){ return (val == "6" || val == "4" || val == "both");},
                    cast: function(val){ return (val == "6" || val == "4") ? parseInt(val) : "both"; }, // This is a cast for multiple types input
                    message: "The ipVersion param can be '4', '6' or 'both'"
                },

                "isTcp": {
                    type: "boolean",
                    cast: function(val){
                        return ((typeof val == "string") ? (val == "true") : val);// This is a cast for multiple types input
                    }
                },

                "filterProbes": {
                    type: "boolean",
                    cast: function(val){
                        return ((typeof val == "string") ? (val == "true") : val);// This is a cast for multiple types input
                    }
                },

                "defaultTimeWindow": {
                    type: function(val){ return (val == "5h" || val == "1d" || val == "1w" || val == "1m");},
                    message: "The defaultTimeWindow param can be '5h', '1d', '1w', or '1m' or an interval expressed in seconds"
                }
            };

            params = this._helper(validatorMap, params);

            outParams = {};

            zone = params[zoneName];
            server = params[serverName];
            type = params[typeName];
            startDate = params[startDateName];
            endDate = params[endDateName];
            timeWindow = params[timeWindowName];
            selectedRows = params[selectedRowsName];
            filterProbes = params[filterProbesName];
            isTcp = params[isTcpName];
            ipVersion = params[ipVersionName];

            if (server){
                outParams.group = this.convertRemoteToLocalId(server);
                if (zone) outParams.root = this.convertRemoteToLocalId(zone);
            }else{
                if (zone) outParams.group = this.convertRemoteToLocalId(zone);
            }

            if (type) outParams.type = this.convertRemoteToLocalType(type);
            if (filterProbes != null) outParams.filterProbes = filterProbes;

            if (startDate) outParams.startDate = this.convertRemoteToLocalDate(startDate);
            if (endDate) outParams.endDate = this.convertRemoteToLocalDate(endDate);

            if (selectedRows != null) outParams.selectedRows = this.convertRemoteToLocalSelectedRows(selectedRows);


            if (ipVersion) outParams.ipVersion = ((ipVersion == 'both') ? null : ipVersion);
            if (timeWindow) outParams.timeWindow = this.convertRemoteToLocalTimeWindow(timeWindow);

            if (isTcp != null) outParams.isTcp = isTcp;

            return outParams;
        };


        /**
         * This method converts the parameters vector from the internal to the external format.
         * It is the opposite of fromExternalToInternal.
         *
         * @method fromInternalToExternal
         * @input {Object} params A vector of parameters
         * @return {Object} A vector of parameters
         */

        this.fromInternalToExternal = function(params){
            var zone, server, outParams, zoneName, serverName, typeName, startDateName, endDateName, selectedRowsName,
                ipVersionName, isTcpName, timeWindowName, filterProbesName;

            zoneName = "zone";
            serverName = "server";
            typeName = "type";
            startDateName = "startTime";
            endDateName = "endTime";
            selectedRowsName = "selectedRows";
            ipVersionName = "ipVersion";
            isTcpName = "isTcp";
            timeWindowName = "timeWindow";
            filterProbesName = "filterProbes";

            outParams = {};

            outParams[typeName] = this.convertLocalToRemoteType(params.type);

            if (params.type == 'probes'){
                outParams[serverName] = (params.group) ? this.convertLocalToRemoteId(params.group) : null;
                outParams[zoneName] = this.convertLocalToRemoteId(params.root);
            }else if (params.type == 'servers'){
                outParams[serverName] = null;
                outParams[zoneName] = (params.group) ? this.convertLocalToRemoteId(params.group) : null;
            }


            outParams[startDateName] =  (params.startDate) ? this.convertLocalToRemoteDate(params.startDate) : null;

            outParams[endDateName] = (params.endDate)  ? this.convertLocalToRemoteDate(params.endDate) : null;
            outParams[selectedRowsName] = this.convertLocalToRemoteSelectedRows(params.selectedRows);

            outParams[filterProbesName] = params.filterProbes;

            outParams[timeWindowName] = (params.timeWindow) ? this.convertLocalToRemoteTimeWindow(params.timeWindow) : null;

            outParams[ipVersionName] = params.ipVersion || 'both';

            outParams[isTcpName] = params.isTcp;

            return outParams;
        };


        /**
         * This method is an input checker for the external parameters.
         *
         * @method _helper
         * @private
         * @input {Object} validationMap A validation Map composed of types, cast functions and error messages
         * @input {Object} parameters A vector of parameters
         * @return {Object} A vector of parameters cased with the cast functions described in the validationMap
         */

        this._helper = function(validationMap, parameters){
            var validationItem, validator, messages, value;

            messages = [];

            for (var parameter in parameters){

                validationItem = validationMap[parameter];
                value = parameters[parameter];

                if (value && validationItem){

                    if (validationItem.cast){
                        parameters[parameter] = validationItem.cast(value);
                        value = parameters[parameter];
                    }

                    validator = (typeof validationItem.type == "function") ? validationItem.type : function(val){ return (typeof val == validationItem.type); };

                    if (!validator(value)){
                        if (validationItem.message){
                            messages.push(validationItem.message);
                        }else{
                            messages.push(parameter + " must be a " + validationItem.type);
                        }
                    }
                }
            }

            if (messages.length > 0){
                alert("Input errors: " + messages.join(', '));
            }

            return parameters;
        };


        /**
         * This method initializes an empty/default vector of parameters
         *
         * @method createInternalParamVector
         * @return {Object} A vector of parameters
         */

        this.createInternalParamVector = function(){
            return {
                startDate: null,
                endDate : null,
                type: null,
                group: null,
                root: null,
                selectedRows: [],
                ipVersion: null,
                isTcp: null,
                filterProbes: false,
                defaultTimeWindow: null
            };
        };


        /**
         * This method converts a set of selectedRows from the internal to the external format
         *
         * @method convertLocalToRemoteSelectedRows
         * @input {String} selectedRows An array of rows IDs
         * @return {String} A string of comma separated rows IDs
         */

        this.convertLocalToRemoteSelectedRows = function(selectedRows){
            return (selectedRows.length > 0) ? utils.join($.map(selectedRows, this.convertLocalToRemoteId), ',') : '';
        };


        /**
         * This method converts a set of selectedRows from the external to the internal format
         *
         * @method convertRemoteToLocalSelectedRows
         * @input {String} selectedRows A string of comma separated rows IDs
         * @return {Array} An array of rows IDs
         */
        this.convertRemoteToLocalSelectedRows = function(selectedRows){
            return (selectedRows != '') ? $.map(selectedRows.split(','), this.convertRemoteToLocalId) : [];
        };


        /**
         * This method converts IDs from the external to the internal format
         *
         * @method convertRemoteToLocalId
         * @input {String} remoteId An ID in the external format
         * @return {String} An ID in the internal format
         */

        this.convertRemoteToLocalId = function(remoteId){
            return new String(remoteId)
                .replace(/\./g, 'dnsmndt')
                .replace(/\:/g, 'dnsmnsmcl');
        };


        /**
         * This method converts IDs from the internal to the external format
         *
         * @method convertLocalToRemoteId
         * @input {String} remoteId An ID in the internal format
         * @return {String} An ID in the external format
         */

        this.convertLocalToRemoteId = function(localId){
            return new String(localId)
                .replace(/dnsmndt/g, '.')
                .replace(/dnsmnsmcl/g, ':');
        };


        /**
         * This method converts Dates from the internal to the external format
         *
         * @method convertLocalToRemoteDate
         * @input {Date} local A Date object
         * @return {Number} A Unix timestamp
         */

        this.convertLocalToRemoteDate = function(local){
            return (!local) ? null : utils.dateToUTCTimestamp(local);
        };


        /**
         * This method converts Dates from the external to the internal format
         *
         * @method convertRemoteToLocalDate
         * @input {Date} remote A date object in the external format
         * @return {Number} A Unix timestamp
         */

        this.convertRemoteToLocalDate = function(remote){
            return (!remote) ? null : utils.timestampToLocalDate(remote);
        };


        /**
         * This method converts Types from the external to the internal format
         *
         * @method convertRemoteToLocalType
         * @input {String} remote A Type in the external format
         * @return {String} A Type in the internal format
         */

        this.convertRemoteToLocalType = function(remote){
            var out;

            switch(remote){
                case "zone-servers":
                    out = "servers";
                    break;

                case "server-probes":
                    out = "probes";
                    break;
            }

            return out;
        };


        /**
         * This method converts types from the internal to the external format
         *
         * @method convertLocalToRemoteType
         * @input {String} local A Type in the internal format
         * @return {String} A Type in the external format
         */

        this.convertLocalToRemoteType = function(local){
            var out;

            switch(local){
                case "servers":
                    out = "zone-servers";
                    break;

                case "probes":
                    out = "server-probes";
                    break;
            }

            return out;
        };


        /**
         * This method converts time windows from the external to the internal format
         *
         * @method convertRemoteToLocalTimeWindow
         * @input {Object} remote A time window can be expressed as a string (i.e. "5h", "1d", "1w", "1m") or as an amount of seconds
         * @return {Number} A time window expressed in seconds
         */

        this.convertRemoteToLocalTimeWindow = function(remote){
            var value;

            if (typeof remote == 'string'){

                switch(remote){

                    case "5h":
                        value = 5 * 3600;
                        break;

                    case "1d":
                        value = 24 * 3600;
                        break;

                    case "1w":
                        value = 7 * 24 * 3600;
                        break;

                    case "1m":
                        value = 30 * 24 * 3600;
                        break;
                }
            }else{
                value = remote;
            }

            return value; // seconds
        };


        /**
         * This method converts time windows from the internal to the external format
         *
         * @method convertLocalToRemoteTimeWindow
         * @input {Number} local A time window expressed in seconds
         * @return {Object} A time window expressed in seconds, in future also strings can be used
         */

        this.convertLocalToRemoteTimeWindow = function(local){
            return local; // No conversion
        }



    };

    return new ParamsManager(); //singleton
});