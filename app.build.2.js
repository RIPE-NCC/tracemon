({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    name: 'latencymon-loader',

    paths:{
        /* environment */
        "latencymon.env": "dev/environment/environment",
        "latencymon.env.utils": "dev/environment/utils",
        "latencymon.env.config": "dev/environment/config",
        "latencymon.env.params-manager": "dev/environment/ParamsManager",
        "latencymon.env.history-manager": "dev/environment/HistoryManager",
        "latencymon.env.languages.en": "dev/environment/languages/language.eng",


        /* libs */
        "latencymon.lib.d3": "dev/libs/d3/js/d3.v3.new",
        "latencymon.lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "latencymon.lib.jquery-ui": "dev/libs/jquery/jquery-ui.min",
        "latencymon.lib.tree-map": "dev/libs/TreeMap",
        "latencymon.lib.date-format": "dev/libs/dateFormat",
        "latencymon.lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "latencymon.lib.socket-io": "dev/libs/socket.io",
        "latencymon.lib.bootstrap-table": "dev/libs/bootstrap-table/bootstrap-table.min",
        "latencymon.lib.jquery-amd": "dev/libs/jquery-libs-amd",
        "latencymon.lib.jquery-libs": "dev/libs/jquery-libs",


        "latencymon.lib.d3-magnetic-cursor": "dev/libs/d3-magnetic-cursor",


        /* model */


        /* view */
        "latencymon.view.main": "dev/view/MainView",
        "latencymon.view.chart.singleProbe": "dev/view/ChartSingleProbeView",
        "latencymon.view.chart.multiProbe": "dev/view/ChartMultiProbeView",
        "latencymon.view.chart.comparison": "dev/view/ChartComparisonView",

        "latencymon.view.viewport": "dev/view/ViewPort",
        "latencymon.view.chartManager": "dev/view/ChartManager",
        "latencymon.view.templateManager": "dev/view/TemplateManagerView",
        "latencymon.view.timeOverview": "dev/view/TimeOverviewView",

        /* view.svg */
        "latencymon.view.svg.chart": "dev/view/svg/SvgChartView",


        /* model*/
        "latencymon.model.group": "dev/model/Group",

        /* controller */
        "latencymon.controller.gesture-manager": "dev/controller/GesturesManager",
        "latencymon.controller.group-manager": "dev/controller/GroupManager",
        "latencymon.controller.url-manager": "dev/controller/UrlManager",
        "latencymon.controller.main": "dev/controller/main",

        /* data manipulation */
        "latencymon.filter.relative-rtt": "dev/filter/RelativeRTTFilter",
        "latencymon.filter.natural-rtt": "dev/filter/NaturalRTTFilter",


        /* connector */
        "latencymon.connector.facade": "dev/connector/ConnectorFacade",
        "latencymon.connector.history": "dev/connector/HistoryConnector",
        "latencymon.connector.history-auto": "dev/connector/HistoryConnectorAutoResolution",
        "latencymon.connector.live": "dev/connector/LiveConnector",
        "latencymon.connector.translate-to-ping": "dev/connector/TranslateToPing",


        /* session */
        //"session.facade": LATENCYMON_SESSION_URL + "SessionManager"
    },
    shim:{

        "latencymon.lib.d3": {
            exports: "latencymon_d3"
        },

        "latencymon.lib.d3-magnetic-cursor": {
            deps: ["latencymon.lib.d3"],
            exports: "latencymon_d3"
        },

        "latencymon.lib.socket-io": {
            exports: "latencymon_io"
        }

    },

    optimize: "uglify2",//uglify2
    wrapShim: true,
    generateSourceMaps: true,

    out: "latencymon-dist.js"


})