/**
 * Created by mcandela on 11/12/13.
 */

define([
    "env.utils",
    "env.params-manager"
], function(utils, paramsManager){

    /**
     * HistoryManager provides all the functions to manage the history and the back/forward browser interactions.
     *
     * @class HistoryManager
     * @constructor
     * @module environment
     */

    var HistoryManager = function(env){
        var config, pushNewStatuses, keyPrefix, $this, initialisationHistory, initialisationSession, isInitialStatus,
            isFirstAutoUpdateAction;

        $this = this;
        config = env.config;
        pushNewStatuses = true;
        isInitialStatus = true;
        isFirstAutoUpdateAction = true;

        keyPrefix = utils.getInstanceSuffix(env.parentDom);


        /**
         * This method initialises the module. It pushes in the history and updates the URL with the initialisation query
         * and session parameters.
         *
         * @method init
         */

        this.init = function(){
            if (config.historyInUrlAtInitialisation){
                this.update();
            }else{
                initialisationHistory = utils.lightClone(env.params);
                initialisationSession = utils.lightClone(env.session.getSession());
            }
        };


        /**
         * This method pushes in the history and updates the URL with the actual query and session parameters.
         *
         * @method update
         */

        this.update = function(){
            var params, currentState, session;

            if (config.historyInUrl && pushNewStatuses){
                params = env.params;
                session = env.session.getSession();

                isInitialStatus = false;

                currentState = this._generateStateUrl(params, session);

                if (!env.isUpdatedPeriodicallyActive || isFirstAutoUpdateAction) { // Is not an update action or is the first update action

                    window.history.pushState({}, 'dnsmon_state', currentState);
                    isFirstAutoUpdateAction = !env.isUpdatedPeriodicallyActive;

                }else{

                    window.history.replaceState({}, 'dnsmon_state', currentState);

                }
            }else{
                pushNewStatuses = true;
            }
        };


        /**
         * This method pushes in the history and updates the URL with the actual query and session parameters.
         *
         * @method _generateStateUrl
         * @private
         *
         */

        this._generateStateUrl = function(params, session){
            return '?' + this._generateParametersUrl(params, this._generateSessionUrl(session)).split('?')[1]; // Remove the host
        };


        /**
         * This method creates an URL with all the session parameters.
         *
         * @method _generateSessionUrl
         * @private
         * @input {Object} session A vector of session parameters
         * @return {String} The updated URL
         */

        this._generateSessionUrl = function(session){

            var actualUrl;

            actualUrl = utils.getCurrentUrl();

            for (var key in session){
                actualUrl = utils.setParam(keyPrefix + '.session.' + key, session[key], actualUrl);
            }

            return actualUrl;
        };


        /**
         * This method updates the given URL with all the query parameters.
         *
         * @method _generateParametersUrl
         * @private
         * @input {Object} params A vector of query parameters
         * @input {String} sessionUrl An URL
         * @return {String} The updated URL
         */

        this._generateParametersUrl = function(params, sessionUrl){
            var externalParams, actualUrl;

            actualUrl = sessionUrl;
            externalParams = paramsManager.fromInternalToExternal(params);

            for (var key in externalParams){
                actualUrl = utils.setParam(keyPrefix + '.' + key, externalParams[key], actualUrl);
            }

            return actualUrl;
        };


        /**
         * This method is triggered every time there is a back/forward event in the browser. It recovers and applies
         * the history.
         *
         * @method updateStatusFromUrl
         */

        this.updateStatusFromUrl = function(){

            if (!isInitialStatus){ //Chrome and Safari workaround (html5 specs: onpopstate should not be triggered at initialisation time
                pushNewStatuses = false;

                if (env.isUpdatedPeriodicallyActive){// Disable the keep updated if active
                    env.mainView.controlPanel.keepUpdatedActive(false);
                }

                if (!$this.setStatusFromUrl()){ // If the status has not been set, set the status stored at initialisation time

                    env.params = initialisationHistory;
                    env.session.setSession(initialisationSession);
                }

                env.mainView.redraw(function(){ // Redraw the scene
                    env.mainView.breadcrumbs.pushHistory(this._createHistory(env.params));
                }, $this);
            }

        };


        /**
         * This method applies the current permalink to the scene.
         *
         * @method setStatusFromUrl
         */

        this.setStatusFromUrl = function(){
            var params, session, paramsAndSession;

            paramsAndSession = utils.getUrlParameters(env.parentDom);

            if (paramsAndSession != null && paramsAndSession.type != null){
                session = paramsAndSession.session;
                env.params.selectedRows = [];
                params = paramsManager.mergeParams(env.params, paramsManager.fromExternalToInternal(paramsAndSession));

                env.params = params;
                env.session.setSession(session);

                env.initialHistory = this._createHistory(params);

                return true;
            }

            return false;
        };


        /**
         * This method re-creates a navigation history given a vector of query parameters.
         * So it allows the user to share also a navigation history by sharing a permalink.
         *
         * @method _createHistory
         * @private
         */

        this._createHistory = function(params){
            var history;

            history = [];

            switch(params.type){

                case "servers":

                    history.push({
                        id: params.group + "",
                        params: utils.lightClone(params)
                    });

                    break;

                case "probes":

                    history.push({
                        id: params.root + "",
                        params: {
                            type: "servers",
                            root: null,
                            group: params.root + "",
                            selectedRows: []
                        }
                    });

                    history.push({
                        id: params.group + "",
                        params: utils.lightClone(params)
                    });

                    break;
            }

            return history;
        };


        if (config.allowPermalinks){
            this.setStatusFromUrl();
        }

        if (config.historyInUrl){
            window.onpopstate = this.updateStatusFromUrl;
        }

    };

    return HistoryManager;
});