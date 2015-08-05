/**
 * Some require.js configurations
 */

requirejs.config({
    paths:{
        /* environment */
        "env": STACKEDPINGS_ENVIRONMENT_URL + "environment",
        "env.utils": STACKEDPINGS_ENVIRONMENT_URL + "utils",
        "env.config": STACKEDPINGS_ENVIRONMENT_URL + "config",
        "env.params-manager": STACKEDPINGS_ENVIRONMENT_URL + "ParamsManager",
        "env.history-manager": STACKEDPINGS_ENVIRONMENT_URL + "HistoryManager",
        "env.languages.en": STACKEDPINGS_ENVIRONMENT_URL + "languages/language.eng",


        /* libs */
        "lib.d3": STACKEDPINGS_LIB_URL + "d3/js/d3.v3.new",
        "lib.jquery": STACKEDPINGS_LIB_URL + "jquery/jquery-1.11.1.min",
        "lib.jquery-ui": STACKEDPINGS_LIB_URL + "jquery/jquery-ui.min",
        "lib.tree-map": STACKEDPINGS_LIB_URL + "TreeMap",
        "lib.date-format": STACKEDPINGS_LIB_URL + "dateFormat",
        "lib.bootstrap": STACKEDPINGS_LIB_URL + "bootstrap/js/bootstrap.min",
        "lib.socket-io": STACKEDPINGS_LIB_URL + "socket.io",
        "lib.bootstrap-table": STACKEDPINGS_LIB_URL + "bootstrap-table/bootstrap-table.min",
        "lib.jquery-amd": STACKEDPINGS_LIB_URL + "jquery-libs-amd",
        "lib.jquery-libs": STACKEDPINGS_LIB_URL + "jquery-libs",


        "lib.d3-magnetic-cursor": STACKEDPINGS_LIB_URL + "d3-magnetic-cursor",


        /* model */


        /* view */
        "view.main": STACKEDPINGS_VIEW_URL + "MainView",
        "view.chart.singleProbe": STACKEDPINGS_VIEW_URL + "ChartSingleProbeView",
        "view.chart.multiProbe": STACKEDPINGS_VIEW_URL + "ChartMultiProbeView",
        "view.chart.comparison": STACKEDPINGS_VIEW_URL + "ChartComparisonView",

        "view.viewport": STACKEDPINGS_VIEW_URL + "ViewPort",
        "view.chartManager": STACKEDPINGS_VIEW_URL + "ChartManager",
        "view.templateManager": STACKEDPINGS_VIEW_URL + "TemplateManagerView",
        "view.timeOverview": STACKEDPINGS_VIEW_URL + "TimeOverviewView",

        /* view.svg */
        "view.svg.chart": STACKEDPINGS_VIEW_URL + "svg/SvgChartView",


        /* model*/
        "model.group": STACKEDPINGS_MODEL_URL + "Group",

        /* controller */
        "controller.gesture-manager": STACKEDPINGS_CONTROLLER_URL + "GesturesManager",
        "controller.group-manager": STACKEDPINGS_CONTROLLER_URL + "GroupManager",
        "controller.url-manager": STACKEDPINGS_CONTROLLER_URL + "UrlManager",
        "controller.main": STACKEDPINGS_CONTROLLER_URL + "main",

        /* data manipulation */
        "filter.relative-rtt": STACKEDPINGS_FILTER_URL + "RelativeRTTFilter",
        "filter.natural-rtt": STACKEDPINGS_FILTER_URL + "NaturalRTTFilter",


        /* connector */
        "connector.facade": STACKEDPINGS_CONNECTOR_URL + "ConnectorFacade",
        //"connector.history": STACKEDPINGS_CONNECTOR_URL + "HistoryConnector",
        "connector.history-auto": STACKEDPINGS_CONNECTOR_URL + "HistoryConnectorAutoResolution",
        "connector.live": STACKEDPINGS_CONNECTOR_URL + "LiveConnector",
        "connector.translate-to-ping": STACKEDPINGS_CONNECTOR_URL + "TranslateToPing",


        /* session */
        "session.facade": STACKEDPINGS_SESSION_URL + "SessionManager"
    },
    shim:{

        "lib.d3": {
            exports: "d3"
        },

        "lib.d3-magnetic-cursor": {
            deps: ["lib.d3"],
            exports: "d3"
        },


        "lib.socket-io": {
            exports: "io"
        },

        "lib.jquery.cookie": {
            deps: ["lib.jquery"]
        },

        "lib.jquery-ui.timepicker": {
            deps: ["lib.jquery-ui"]
        }
    }
});



define([

    "env.utils",
    "env.config",
    "env.languages.en",
    "lib.jquery-amd",
    "controller.main"
], function(utils, config, language, $, main){

    var StackedPings = function(instance){
        var env, instanceParams, queryParams, parentDom, styleDownloads;

        /*
         * Access to the instance
         */
        instanceParams = instance.instanceParams;
        queryParams = instance.queryParams;
        parentDom = instance.domElement;



        /*
         * Convert params
         */


        /*
         * Init Dependency Injection Vector
         */
        env = {
            "version": "29.7.15",
            "widgetUrl": STACKEDPINGS_WIDGET_URL + "dev/",
            "autoStart": (instanceParams.autoStart != undefined) ? instanceParams.autoStart : true,
            "dataApiResults": instanceParams.dataApiResults || config.dataAPIs.results,
            "dataApiMeta": instanceParams.dataApiMeta || config.dataAPIs.meta,
            "streamingUrl": instanceParams.streamingHost || config.streamingUrl,
            "parentDom": $(parentDom),
            "queryParams": queryParams
        };


        /*
         * Initialize Point of Access to Packages
         */


        /*
         * Check if stylesheets are loaded
         */

        if (!instanceParams.dev){
            styleDownloads = [
                STACKEDPINGS_VIEW_URL + "css/style-lib-dist.min.css"
            ];
        } else {

            styleDownloads = [
                STACKEDPINGS_VIEW_URL + "css/style.css",
                STACKEDPINGS_LIB_URL + "jquery/jquery-ui.min.css",
                STACKEDPINGS_LIB_URL + "bootstrap/css/bootstrap.min.css",
                STACKEDPINGS_LIB_URL + "bootstrap/css/bootstrap-theme.min.css",
                STACKEDPINGS_LIB_URL + "bootstrap-table/bootstrap-table.min.css"
            ];

        }


        var objectToBeEnriched = {};
        utils.loadStylesheets(styleDownloads, function(){
            var n, length, methodName;

            env.main = new main(env);

            if (env.autoStart){
                env.main.init();
            }

            function enrichMethod(methodName) {
                objectToBeEnriched[methodName] = function () {
                    env.main[methodName].apply(env.main, arguments);
                }
            }

            for (n=0,length=env.main.exposedMethods.length; n<length; n++){
                methodName = env.main.exposedMethods[n];
                enrichMethod(methodName);
            }
        });


        /**
         * A set of methods exposed outside
         */
        return objectToBeEnriched;
    };

    return StackedPings;
});

