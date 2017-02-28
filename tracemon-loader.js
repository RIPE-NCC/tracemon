/**
 * Some require.js configurations
 */

requirejs.config({
    waitSeconds: 30,
    paths:{
        /* environment */
        "tracemon.env": window.atlas._widgets.tracemon.urls.env + "environment",
        "tracemon.env.utils": window.atlas._widgets.tracemon.urls.env + "utils",
        "tracemon.env.config": window.atlas._widgets.tracemon.urls.env + "config",
        "tracemon.env.params-manager": window.atlas._widgets.tracemon.urls.env + "ParamsManager",
        "tracemon.env.history-manager": window.atlas._widgets.tracemon.urls.env + "HistoryManager",
        "tracemon.env.languages.en": window.atlas._widgets.tracemon.urls.env + "languages/language.eng",
        "tracemon.env.latencymon-adapter": window.atlas._widgets.tracemon.urls.env + "latencyMonAdapter",

        /* libs */
        "tracemon.lib.jquery": window.atlas._widgets.tracemon.urls.libs + "jquery/jquery-1.11.1.min",
        "tracemon.lib.jquery-ui": window.atlas._widgets.tracemon.urls.libs + "jquery/jquery-ui.min",
        "tracemon.lib.tree-map": window.atlas._widgets.tracemon.urls.libs + "TreeMap",
        "tracemon.lib.date-format": window.atlas._widgets.tracemon.urls.libs + "dateFormat",
        "tracemon.lib.bootstrap": window.atlas._widgets.tracemon.urls.libs + "bootstrap/js/bootstrap.min",
        "tracemon.lib.bootstrap-slider": window.atlas._widgets.tracemon.urls.libs + "bootstrap-slider/js/bootstrap-slider",
        "tracemon.lib.bootstrap-select": window.atlas._widgets.tracemon.urls.libs + "bootstrap-select/js/bootstrap-select",
        "tracemon.lib.socket-io": window.atlas._widgets.tracemon.urls.libs + "socket.io",
        "tracemon.lib.bootstrap-table": window.atlas._widgets.tracemon.urls.libs + "bootstrap-table/bootstrap-table.min",
        "tracemon.lib.jquery-amd": window.atlas._widgets.tracemon.urls.libs + "jquery-libs-amd",
        "tracemon.lib.jquery-libs": window.atlas._widgets.tracemon.urls.libs + "jquery-libs",
        "tracemon.lib.ip": window.atlas._widgets.tracemon.urls.libs + "ip",
        "tracemon.lib.parsePrefix": window.atlas._widgets.tracemon.urls.libs + "parsePrefix",
        "tracemon.lib.dagre-d3": window.atlas._widgets.tracemon.urls.libs + "dagre-d3",
        "tracemon.lib.dagre": window.atlas._widgets.tracemon.urls.libs + "dagre",
        "tracemon.lib.mustache": window.atlas._widgets.tracemon.urls.libs + "mustache",
        "tracemon.lib.handlebars": window.atlas._widgets.tracemon.urls.libs + "handlebars",
        "tracemon.lib.text": window.atlas._widgets.tracemon.urls.libs + "require-text",
        "tracemon.lib.stache": window.atlas._widgets.tracemon.urls.libs + "stache",
        "tracemon.lib.d3-amd": window.atlas._widgets.tracemon.urls.libs + "d3/js/d3.v3.amd",
        "tracemon.lib.d3-magnetic-cursor": window.atlas._widgets.tracemon.urls.libs + "d3-magnetic-cursor",
        "tracemon.lib.range-slider": window.atlas._widgets.tracemon.urls.libs + "range-slider/js/ion.rangeSlider",
        "tracemon.lib.reparse": window.atlas._widgets.tracemon.urls.libs + "reparse",
        "tracemon.lib.expression": window.atlas._widgets.tracemon.urls.libs + "expression",
        "tracemon.lib.moment": window.atlas._widgets.tracemon.urls.libs + "moment",

        "tracemon.lib.viz": window.atlas._widgets.tracemon.urls.libs + "viz",


        /* view */
        "tracemon.view.main": window.atlas._widgets.tracemon.urls.view + "MainView",
        "tracemon.view.as-view": window.atlas._widgets.tracemon.urls.view + "ASView",
        "tracemon.view.location-view": window.atlas._widgets.tracemon.urls.view + "LocationView",
        "tracemon.view.label-placement": window.atlas._widgets.tracemon.urls.view + "LabelPlacementHelper",
        "tracemon.view.viewport": window.atlas._widgets.tracemon.urls.view + "ViewPort",
        "tracemon.view.chartManager": window.atlas._widgets.tracemon.urls.view + "ChartManager",
        "tracemon.view.templateManager": window.atlas._widgets.tracemon.urls.view + "TemplateManagerView",
        "tracemon.view.timeOverview": window.atlas._widgets.tracemon.urls.view + "TimeOverviewView",

        "tracemon.view.dagre-wrapper": window.atlas._widgets.tracemon.urls.view + "layout/DagreWrapper",
        "tracemon.view.graphviz-wrapper": window.atlas._widgets.tracemon.urls.view + "layout/GraphvizWrapper",

        "tracemon.view.single-host.single-host-view": window.atlas._widgets.tracemon.urls.view + "single-host/SingleHostView",
        "tracemon.view.single-host.path-view": window.atlas._widgets.tracemon.urls.view + "single-host/PathView",
        "tracemon.view.single-host.node-view": window.atlas._widgets.tracemon.urls.view + "single-host/NodeView",
        "tracemon.view.single-host.label-view": window.atlas._widgets.tracemon.urls.view + "single-host/LabelView",

        /* model*/
        "tracemon.model.host": window.atlas._widgets.tracemon.urls.model + "Host",
        "tracemon.model.autonomousSystem": window.atlas._widgets.tracemon.urls.model + "AutonomousSystem",
        "tracemon.model.hop": window.atlas._widgets.tracemon.urls.model + "Hop",
        "tracemon.model.measurement": window.atlas._widgets.tracemon.urls.model + "Measurement",
        "tracemon.model.traceroute": window.atlas._widgets.tracemon.urls.model + "Traceroute",
        "tracemon.model.attempt": window.atlas._widgets.tracemon.urls.model + "Attempt",

        /* controller */
        "tracemon.controller.gesture-manager": window.atlas._widgets.tracemon.urls.controller + "GesturesManager",
        "tracemon.controller.url-manager": window.atlas._widgets.tracemon.urls.controller + "UrlManager",
        "tracemon.controller.main": window.atlas._widgets.tracemon.urls.controller + "main",
        "tracemon.controller.history-manager": window.atlas._widgets.tracemon.urls.controller + "HistoryManager",
        "tracemon.controller.header": window.atlas._widgets.tracemon.urls.controller + "HeaderController",
        "tracemon.controller.boolean-search": window.atlas._widgets.tracemon.urls.controller + "BooleanSearchHelper",
        "tracemon.controller.source-selection": window.atlas._widgets.tracemon.urls.controller + "SourcesSelectionHelper",


        /* connector */
        "tracemon.connector.facade": window.atlas._widgets.tracemon.urls.connector + "ConnectorFacade",
        "tracemon.connector.history": window.atlas._widgets.tracemon.urls.connector + "HistoryConnector",
        "tracemon.connector.translation": window.atlas._widgets.tracemon.urls.connector + "TranslationConnector",
        "tracemon.connector.live": window.atlas._widgets.tracemon.urls.connector + "LiveConnector",
        "tracemon.connector.peering-db": window.atlas._widgets.tracemon.urls.connector + "PeeringDbConnector",
        "tracemon.connector.host-helper": window.atlas._widgets.tracemon.urls.connector + "HostClassificationHelper",
        "tracemon.connector.asn": window.atlas._widgets.tracemon.urls.connector + "AsnLookupConnector",
        "tracemon.connector.short-name": window.atlas._widgets.tracemon.urls.connector + "ShortNameConnector",

        "tracemon.connector.local.peering-db": window.atlas._widgets.tracemon.urls.connector + "local/peeringDb",

        /* session */
        "tracemon.session.facade": window.atlas._widgets.tracemon.urls.session + "SessionManager"
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
    },

    stache: {
        extension: '.html', // default = '.html'
        path: 'dev/view/html/' // default = ''
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
        var env, instanceParams, queryParams, parentDom, styleDownloads, objectToBeEnriched;

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
            "version": "17.2.14.2",
            "widgetUrl": TRACEMON_WIDGET_URL + "dev/",
            "autoStart": (instanceParams.autoStart != undefined) ? instanceParams.autoStart : config.autoStart,
            "dataApiResults": instanceParams.dataApiResults || config.dataAPIs.results,
            "dataApiMetadata": instanceParams.dataApiMetadata || config.dataAPIs.metadata,
            "dataApiAsAnnotation": instanceParams.dataApiAsAnnotation || config.dataAPIs.dataApiAsAnnotation,
            "dataApiReverseDns": instanceParams.dataApiReverseDns || config.dataAPIs.dataApiReverseDns,
            "dataApiGeolocation": instanceParams.dataApiGeolocation || config.dataAPIs.dataApiGeolocation,
            "shortAsNamesApi": instanceParams.shortAsNamesApi || config.dataAPIs.shortAsNamesApi,
            "dataApiAsnNeighbours": instanceParams.dataApiAsnNeighbours || config.dataAPIs.dataApiAsnNeighbours,
            "streamingUrl": instanceParams.streamingHost || config.streamingUrl,
            "viewName": instanceParams.view || config.defaultViewName,
            "aggregateIPv4": instanceParams.aggregateIPv4 || config.defaultAggregationIPv4,
            "aggregateIPv6": instanceParams.aggregateIPv6 || config.defaultAggregationIPv6,
            "maxNumberHops": instanceParams.maxNumberHops || config.maxNumberHops,
            "templatesLocation": instanceParams.templatesLocation || config.templatesLocation,
            "reproductionSpeed":  instanceParams.reproductionSpeed || config.reproductionSpeed,
            "labelLevel":  instanceParams.labelLevel || config.defaultLabelLevel,
            "peeringDb":  instanceParams.peeringDb || config.dataAPIs.peeringDb,
            "realTimeUpdate":  (instanceParams.realTimeUpdate != null) ? instanceParams.realTimeUpdate : config.realTimeUpdate,
            "onlyCore":  instanceParams.onlyCore,
            "parentDom": $(parentDom),
            "queryParams": queryParams,

            // Defaults for internal env parameters
            "loadedMeasurements": {},
            "loadedSources": {},
            "finalQueryParams": {
                startDate: null,
                stopDate: null,
                sources: null,
                measurements: [],

            },
            "metaData": {
                startDate: null,
                stopDate: null
            }
        };

        window.env = env; // TEMP: just for debugging



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
                window.atlas._widgets.tracemon.urls.view + "css/style-lib-dist.min.css"
            ];
        } else {
            styleDownloads = [
                window.atlas._widgets.tracemon.urls.view + "css/style.css",
                window.atlas._widgets.tracemon.urls.libs + "jquery/jquery-ui.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap/css/bootstrap.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap/css/bootstrap-theme.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap-table/bootstrap-table.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap-slider/css/bootstrap-slider.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap-select2/css/bootstrap-select.css",
                window.atlas._widgets.tracemon.urls.libs + "range-slider/css/ion.rangeSlider.css",
                window.atlas._widgets.tracemon.urls.libs + "range-slider/css/ion.rangeSlider.skinModern.css"
            ];

        }


        objectToBeEnriched = {};

        utils.loadStylesheets(styleDownloads, function(){
            var n, length, methodName, callbackReady;

            env.main = new main(env);

            if (env.autoStart){
                env.main.init();
            }

            function enrichMethod(methodName) {
                objectToBeEnriched[methodName] = function () {
                    return env.main[methodName].apply(env.main, arguments);
                }
            }

            for (n=0,length=env.main.exposedMethods.length; n<length; n++){
                methodName = env.main.exposedMethods[n];
                enrichMethod(methodName);
            }

            callbackReady = window.atlas._widgets.tracemon.instances.callback[parentDom];
            if (callbackReady){
                callbackReady(objectToBeEnriched);
            }
        });


        /**
         * A set of methods exposed outside
         */
        return objectToBeEnriched;
    };

    return Tracemon;
});

