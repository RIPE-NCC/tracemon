({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    name: 'tracemon-loader',

    paths:{
        "tracemon.env": "dev/environment/environment",
        "tracemon.env.utils": "dev/environment/utils",
        "tracemon.env.config": "dev/environment/config",
        "tracemon.env.params-manager": "dev/environment/ParamsManager",
        "tracemon.env.languages.en": "dev/environment/languages/language.eng",
        "tracemon.env.latencymon-adapter": "dev/environment/latencyMonAdapter",

        /* libs */
        "tracemon.lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "tracemon.lib.jquery-ui": "dev/libs/jquery/jquery-ui.min",
        "tracemon.lib.tree-map": "dev/libs/TreeMap",
        "tracemon.lib.date-format": "dev/libs/dateFormat",
        "tracemon.lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "tracemon.lib.bootstrap-slider": "dev/libs/bootstrap-slider/js/bootstrap-slider",
        "tracemon.lib.bootstrap-select": "dev/libs/bootstrap-select/js/bootstrap-select",
        "tracemon.lib.socket-io": "dev/libs/socket.io",
        "tracemon.lib.bootstrap-table": "dev/libs/bootstrap-table/bootstrap-table.min",
        "tracemon.lib.jquery-amd": "dev/libs/jquery-libs-amd",
        "tracemon.lib.jquery-libs": "dev/libs/jquery-libs",
        "tracemon.lib.ip": "dev/libs/ip",
        "tracemon.lib.parsePrefix": "dev/libs/parsePrefix",
        "tracemon.lib.dagre-d3": "dev/libs/dagre-d3",
        "tracemon.lib.dagre": "dev/libs/dagre",
        "tracemon.lib.mustache": "dev/libs/mustache",
        "tracemon.lib.handlebars": "dev/libs/handlebars",
        "tracemon.lib.text": "dev/libs/require-text",
        "tracemon.lib.stache": "dev/libs/stache",
        "tracemon.lib.d3-amd": "dev/libs/d3/js/d3.v3.amd",
        "tracemon.lib.d3-magnetic-cursor": "dev/libs/d3-magnetic-cursor",
        "tracemon.lib.range-slider": "dev/libs/range-slider/js/ion.rangeSlider",
        "tracemon.lib.reparse": "dev/libs/reparse",
        "tracemon.lib.expression": "dev/libs/expression",
        "tracemon.lib.moment": "dev/libs/moment",
        "tracemon.lib.viz": "dev/libs/viz",


        /* view */
        "tracemon.view.main": "dev/view/MainView",
        "tracemon.view.single-host-view": "dev/view/SingleHostView",
        "tracemon.view.as-view": "dev/view/ASView",
        "tracemon.view.location-view": "dev/view/LocationView",
        "tracemon.view.dagre-wrapper": "dev/view/layout/DagreWrapper",
        "tracemon.view.graphviz-wrapper": "dev/view/layout/GraphvizWrapper",
        "tracemon.view.label-placement": "dev/view/LabelPlacementHelper",
        "tracemon.view.viewport": "dev/view/ViewPort",
        "tracemon.view.chartManager": "dev/view/ChartManager",
        "tracemon.view.templateManager": "dev/view/TemplateManagerView",
        "tracemon.view.timeOverview": "dev/view/TimeOverviewView",


        /* Single host view mode*/
        "tracemon.view.single-host.single-host-view": "dev/view/single-host/SingleHostView",
        "tracemon.view.single-host.path-view": "dev/view/single-host/PathView",
        "tracemon.view.single-host.node-view": "dev/view/single-host/NodeView",
        "tracemon.view.single-host.label-view": "dev/view/single-host/LabelView",
        "tracemon.view.single-host.edge-view": "dev/view/single-host/EdgeView",

        /* view.svg */
        "tracemon.view.svg.chart": "dev/view/svg/SvgChartView",

        /* model*/
        "tracemon.model.host": "dev/model/Host",
        "tracemon.model.autonomousSystem": "dev/model/AutonomousSystem",
        "tracemon.model.hop": "dev/model/Hop",
        "tracemon.model.measurement": "dev/model/Measurement",
        "tracemon.model.traceroute": "dev/model/Traceroute",
        "tracemon.model.attempt": "dev/model/Attempt",

        /* controller */
        "tracemon.controller.gesture-manager": "dev/controller/GesturesManager",
        "tracemon.controller.url-manager": "dev/controller/UrlManager",
        "tracemon.controller.main": "dev/controller/main",
        "tracemon.controller.history-manager": "dev/controller/HistoryManager",
        "tracemon.controller.header": "dev/controller/HeaderController",
        "tracemon.controller.boolean-search": "dev/controller/BooleanSearchHelper",
        "tracemon.controller.source-selection": "dev/controller/SourcesSelectionHelper",



        /* connector */
        "tracemon.connector.facade": "dev/connector/ConnectorFacade",
        "tracemon.connector.history": "dev/connector/HistoryConnector",
        "tracemon.connector.translation": "dev/connector/TranslationConnector",
        "tracemon.connector.live": "dev/connector/LiveConnector",
        "tracemon.connector.peering-db": "dev/connector/PeeringDbConnector",
        "tracemon.connector.host-helper": "dev/connector/HostClassificationHelper",
        "tracemon.connector.asn": "dev/connector/AsnLookupConnector",
        "tracemon.connector.short-name": "dev/connector/ShortNameConnector",
        "tracemon.connector.persist-host": "dev/connector/PersistHostConnector",
        "tracemon.connector.log.persist": "dev/connector/log/LogRestConnector",
        "tracemon.connector.ripe-database": "dev/connector/RipeDatabaseConnector",


        /* PeeringDB cache - Remove when we have API*/
        "tracemon.connector.local.peering-db": "dev/connector/local/peeringDb",

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
    },
    stubModules: ["tracemon.lib.text", "tracemon.lib.stache"],
    removeCombined: true,
    optimize: "none",//uglify2
    wrapShim: false,
    generateSourceMaps: false,

    out: "tracemon-dist.js"


})