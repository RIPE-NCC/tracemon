/**
 * Some require.js configurations
 */

requirejs.config({
    waitSeconds: 30,
    paths:{
        /* environment */
        "latencymon.env": LATENCYMON_ENVIRONMENT_URL + "environment",
        "latencymon.env.utils": LATENCYMON_ENVIRONMENT_URL + "utils",
        "latencymon.env.config": LATENCYMON_ENVIRONMENT_URL + "config",
        "latencymon.env.params-manager": LATENCYMON_ENVIRONMENT_URL + "ParamsManager",
        "latencymon.env.history-manager": LATENCYMON_ENVIRONMENT_URL + "HistoryManager",
        "latencymon.env.languages.en": LATENCYMON_ENVIRONMENT_URL + "languages/language.eng",


        /* libs */
        //"latencymon.lib.d3": LATENCYMON_LIB_URL + "d3/js/d3.v3.amd",

        "latencymon.lib.jquery": LATENCYMON_LIB_URL + "jquery/jquery-1.11.1.min",
        "latencymon.lib.jquery-ui": LATENCYMON_LIB_URL + "jquery/jquery-ui.min",
        "latencymon.lib.tree-map": LATENCYMON_LIB_URL + "TreeMap",
        "latencymon.lib.date-format": LATENCYMON_LIB_URL + "dateFormat",
        "latencymon.lib.bootstrap": LATENCYMON_LIB_URL + "bootstrap/js/bootstrap.min",
        "latencymon.lib.socket-io": LATENCYMON_LIB_URL + "socket.io",
        "latencymon.lib.bootstrap-table": LATENCYMON_LIB_URL + "bootstrap-table/bootstrap-table.min",
        "latencymon.lib.jquery-amd": LATENCYMON_LIB_URL + "jquery-libs-amd",
        "latencymon.lib.jquery-libs": LATENCYMON_LIB_URL + "jquery-libs",


        "latencymon.lib.d3-amd": LATENCYMON_LIB_URL + "d3/js/d3.v3.amd",
        "latencymon.lib.d3-magnetic-cursor": LATENCYMON_LIB_URL + "d3-magnetic-cursor",


        /* model */


        /* view */
        "latencymon.view.main": LATENCYMON_VIEW_URL + "MainView",
        "latencymon.view.chart.singleProbe": LATENCYMON_VIEW_URL + "ChartSingleProbeView",
        "latencymon.view.chart.multiProbe": LATENCYMON_VIEW_URL + "ChartMultiProbeView",
        "latencymon.view.chart.comparison": LATENCYMON_VIEW_URL + "ChartComparisonView",

        "latencymon.view.viewport": LATENCYMON_VIEW_URL + "ViewPort",
        "latencymon.view.chartManager": LATENCYMON_VIEW_URL + "ChartManager",
        "latencymon.view.templateManager": LATENCYMON_VIEW_URL + "TemplateManagerView",
        "latencymon.view.timeOverview": LATENCYMON_VIEW_URL + "TimeOverviewView",

        /* view.svg */
        "latencymon.view.svg.chart": LATENCYMON_VIEW_URL + "svg/SvgChartView",


        /* model*/
        "latencymon.model.group": LATENCYMON_MODEL_URL + "Group",

        /* controller */
        "latencymon.controller.gesture-manager": LATENCYMON_CONTROLLER_URL + "GesturesManager",
        "latencymon.controller.group-manager": LATENCYMON_CONTROLLER_URL + "GroupManager",
        "latencymon.controller.url-manager": LATENCYMON_CONTROLLER_URL + "UrlManager",
        "latencymon.controller.main": LATENCYMON_CONTROLLER_URL + "main",

        /* data manipulation */
        "latencymon.filter.relative-rtt": LATENCYMON_FILTER_URL + "RelativeRTTFilter",
        "latencymon.filter.natural-rtt": LATENCYMON_FILTER_URL + "NaturalRTTFilter",


        /* connector */
        "latencymon.connector.facade": LATENCYMON_CONNECTOR_URL + "ConnectorFacade",
        //"connector.history": LATENCYMON_CONNECTOR_URL + "HistoryConnector",
        "latencymon.connector.history-auto": LATENCYMON_CONNECTOR_URL + "HistoryConnectorAutoResolution",
        "latencymon.connector.live": LATENCYMON_CONNECTOR_URL + "LiveConnector",
        "latencymon.connector.translate-to-ping": LATENCYMON_CONNECTOR_URL + "TranslateToPing",


        /* session */
        "latencymon.session.facade": LATENCYMON_SESSION_URL + "SessionManager"
    },
    shim:{

        "latencymon.lib.d3-magnetic-cursor": {
            deps: ["latencymon.lib.d3-amd"]
        },


        "latencymon.lib.socket-io": {
            exports: "io"
        },

        "latencymon.lib.jquery.cookie": {
            deps: ["latencymon.lib.jquery"]
        },

        "latencymon.lib.jquery-ui.timepicker": {
            deps: ["latencymon.lib.jquery-ui"]
        }
    }
});



define([
    "latencymon.env.utils",
    "latencymon.env.config",
    "latencymon.env.languages.en",
    "latencymon.lib.jquery-amd",
    "latencymon.controller.main"
], function(utils, config, language, $, main){

    var Latencymon = function(instance){
        var env, instanceParams, queryParams, parentDom, styleDownloads;

        /*
         * Access to the instance
         */
        instanceParams = instance.instanceParams;
        queryParams = instance.queryParams;
        parentDom = instance.domElement;

        /*
         * Init Dependency Injection Vector
         */
        env = {
            "version": "15.10.29.2",
            "widgetUrl": LATENCYMON_WIDGET_URL + "dev/",
            "autoStart": (instanceParams.autoStart != undefined) ? instanceParams.autoStart : config.autoStart,
            "dataApiResults": instanceParams.dataApiResults || config.dataAPIs.results,
            "dataApiMeta": instanceParams.dataApiMeta || config.dataAPIs.meta,
            "streamingUrl": instanceParams.streamingHost || config.streamingUrl,
            "syncWithRealTimeData": (instanceParams.syncWithRealTimeData != undefined) ? instanceParams.syncWithRealTimeData : config.syncWithRealTimeData,
            "autoStartGrouping": (instanceParams.autoStartGrouping != undefined) ? instanceParams.autoStartGrouping : config.autoStartGrouping,
            "parentDom": $(parentDom),
            "queryParams": queryParams
        };

        /*
         * Check if parent dom exists
         */
        if (!env.parentDom || env.parentDom.length == 0){
            throw "It was not possible to find the DOM element to populate";
        }


        /*
         * Check if stylesheets are loaded
         */

        if (!instanceParams.dev){
            styleDownloads = [
                LATENCYMON_VIEW_URL + "css/style-lib-dist.min.css"
            ];
        } else {

            styleDownloads = [
                LATENCYMON_VIEW_URL + "css/style.css",
                LATENCYMON_LIB_URL + "jquery/jquery-ui.min.css",
                LATENCYMON_LIB_URL + "bootstrap/css/bootstrap.min.css",
                LATENCYMON_LIB_URL + "bootstrap/css/bootstrap-theme.min.css",
                LATENCYMON_LIB_URL + "bootstrap-table/bootstrap-table.min.css"
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

    return Latencymon;
});

