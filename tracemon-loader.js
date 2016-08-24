/**
 * Some require.js configurations
 */

requirejs.config({
    waitSeconds: 30,
    paths:{
        /* environment */
        "tracemon.env": TRACEMON_ENVIRONMENT_URL + "environment",
        "tracemon.env.utils": TRACEMON_ENVIRONMENT_URL + "utils",
        "tracemon.env.config": TRACEMON_ENVIRONMENT_URL + "config",
        "tracemon.env.params-manager": TRACEMON_ENVIRONMENT_URL + "ParamsManager",
        "tracemon.env.history-manager": TRACEMON_ENVIRONMENT_URL + "HistoryManager",
        "tracemon.env.languages.en": TRACEMON_ENVIRONMENT_URL + "languages/language.eng",


        /* libs */
        //"tracemon.lib.d3": TRACEMON_LIB_URL + "d3/js/d3.v3.amd",

        "tracemon.lib.jquery": TRACEMON_LIB_URL + "jquery/jquery-1.11.1.min",
        "tracemon.lib.jquery-ui": TRACEMON_LIB_URL + "jquery/jquery-ui.min",
        "tracemon.lib.tree-map": TRACEMON_LIB_URL + "TreeMap",
        "tracemon.lib.date-format": TRACEMON_LIB_URL + "dateFormat",
        "tracemon.lib.bootstrap": TRACEMON_LIB_URL + "bootstrap/js/bootstrap.min",
        "tracemon.lib.socket-io": TRACEMON_LIB_URL + "socket.io",
        "tracemon.lib.bootstrap-table": TRACEMON_LIB_URL + "bootstrap-table/bootstrap-table.min",
        "tracemon.lib.jquery-amd": TRACEMON_LIB_URL + "jquery-libs-amd",
        "tracemon.lib.jquery-libs": TRACEMON_LIB_URL + "jquery-libs",
        "tracemon.lib.ip": TRACEMON_LIB_URL + "ip",
        "tracemon.lib.parsePrefix": TRACEMON_LIB_URL + "parsePrefix",

        "tracemon.lib.dagre-d3": TRACEMON_LIB_URL + "dagre-d3",
        "tracemon.lib.dagre": TRACEMON_LIB_URL + "dagre",



        "tracemon.lib.d3-amd": TRACEMON_LIB_URL + "d3/js/d3.v3.amd",
        "tracemon.lib.d3-magnetic-cursor": TRACEMON_LIB_URL + "d3-magnetic-cursor",


        /* model */


        /* view */
        "tracemon.view.main": TRACEMON_VIEW_URL + "MainView",
        "tracemon.view.single-host-view": TRACEMON_VIEW_URL + "SingleHostView",
        "tracemon.view.as-view": TRACEMON_VIEW_URL + "ASView",
        "tracemon.view.location-view": TRACEMON_VIEW_URL + "LocationView",
        "tracemon.view.dagre-wrapper": TRACEMON_VIEW_URL + "DagreWrapper",
        "tracemon.view.label-placement": TRACEMON_VIEW_URL + "LabelPlacementHelper",


        "tracemon.view.viewport": TRACEMON_VIEW_URL + "ViewPort",
        "tracemon.view.chartManager": TRACEMON_VIEW_URL + "ChartManager",
        "tracemon.view.templateManager": TRACEMON_VIEW_URL + "TemplateManagerView",
        "tracemon.view.timeOverview": TRACEMON_VIEW_URL + "TimeOverviewView",

        /* view.svg */
        "tracemon.view.svg.chart": TRACEMON_VIEW_URL + "svg/SvgChartView",


        /* model*/
        "tracemon.model.host": TRACEMON_MODEL_URL + "Host",
        "tracemon.model.facade": TRACEMON_MODEL_URL + "Facade",
        "tracemon.model.autonomousSystem": TRACEMON_MODEL_URL + "AutonomousSystem",
        "tracemon.model.hop": TRACEMON_MODEL_URL + "Hop",
        "tracemon.model.measurement": TRACEMON_MODEL_URL + "Measurement",
        "tracemon.model.traceroute": TRACEMON_MODEL_URL + "Traceroute",
        "tracemon.model.attempt": TRACEMON_MODEL_URL + "Attempt",

        /* controller */
        "tracemon.controller.gesture-manager": TRACEMON_CONTROLLER_URL + "GesturesManager",
        "tracemon.controller.url-manager": TRACEMON_CONTROLLER_URL + "UrlManager",
        "tracemon.controller.main": TRACEMON_CONTROLLER_URL + "main",
        "tracemon.controller.history-manager": TRACEMON_CONTROLLER_URL + "HistoryManager",

        /* data manipulation */
        "tracemon.filter.relative-rtt": TRACEMON_FILTER_URL + "RelativeRTTFilter",
        "tracemon.filter.natural-rtt": TRACEMON_FILTER_URL + "NaturalRTTFilter",


        /* connector */
        "tracemon.connector.facade": TRACEMON_CONNECTOR_URL + "ConnectorFacade",
        "tracemon.connector.history": TRACEMON_CONNECTOR_URL + "HistoryConnector",
        "tracemon.connector.translation": TRACEMON_CONNECTOR_URL + "TranslationConnector",
        "tracemon.connector.live": TRACEMON_CONNECTOR_URL + "LiveConnector",
        "tracemon.connector.peering-db": TRACEMON_CONNECTOR_URL + "PeeringDbConnector",
        "tracemon.connector.host-helper": TRACEMON_CONNECTOR_URL + "HostClassificationHelper",
        "tracemon.connector.asn": TRACEMON_CONNECTOR_URL + "AsnLookupConnector",


        /* session */
        "tracemon.session.facade": TRACEMON_SESSION_URL + "SessionManager"
    },
    shim:{

        "tracemon.lib.d3-magnetic-cursor": {
            deps: ["tracemon.lib.d3-amd"]
        },


        "tracemon.lib.socket-io": {
            exports: "io"
        },

        "tracemon.lib.jquery.cookie": {
            deps: ["tracemon.lib.jquery"]
        },

        "tracemon.lib.jquery-ui.timepicker": {
            deps: ["tracemon.lib.jquery-ui"]
        },

        "tracemon.lib.dagre-d3": {
            deps: ["tracemon.lib.d3-amd"],
            exports: 'dagreD3'
        },

        "tracemon.lib.dagre": {
            exports: 'dagre'
        }
    }
});



define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.controller.main"
], function(utils, config, language, $, main){

    var Tracemon = function(instance){
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
            "version": "16.1.19.1",
            "widgetUrl": TRACEMON_WIDGET_URL + "dev/",
            "autoStart": (instanceParams.autoStart != undefined) ? instanceParams.autoStart : config.autoStart,
            "dataApiResults": instanceParams.dataApiResults || config.dataAPIs.results,
            "dataApiMetadata": instanceParams.dataApiMetadata || config.dataAPIs.metadata,
            "dataApiAsAnnotation": instanceParams.dataApiAsAnnotation || config.dataAPIs.dataApiAsAnnotation,
            "dataApiReverseDns": instanceParams.dataApiReverseDns || config.dataAPIs.dataApiReverseDns,
            "dataApiGeolocation": instanceParams.dataApiGeolocation || config.dataAPIs.dataApiGeolocation,
            "dataApiAsnNeighbours": instanceParams.dataApiAsnNeighbours || config.dataAPIs.dataApiAsnNeighbours,
            "streamingUrl": instanceParams.streamingHost || config.streamingUrl,
            "viewName": instanceParams.view || config.defaultViewName,
            "aggregateIPv4": instanceParams.aggregateIPv4 || config.defaultAggregationIPv4,
            "aggregateIPv6": instanceParams.aggregateIPv6 || config.defaultAggregationIPv6,
            "maxNumberHops": instanceParams.maxNumberHops || config.maxNumberHops,
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
                TRACEMON_VIEW_URL + "css/style-lib-dist.min.css"
            ];
        } else {

            styleDownloads = [
                TRACEMON_VIEW_URL + "css/style.css",
                TRACEMON_LIB_URL + "jquery/jquery-ui.min.css",
                TRACEMON_LIB_URL + "bootstrap/css/bootstrap.min.css",
                TRACEMON_LIB_URL + "bootstrap/css/bootstrap-theme.min.css",
                TRACEMON_LIB_URL + "bootstrap-table/bootstrap-table.min.css"
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

    return Tracemon;
});

