({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    name: 'latencymon-loader',

    paths:{
        /* environment */
        "env": "dev/environment/environment",
        "env.utils": "dev/environment/utils",
        "env.config": "dev/environment/config",
        "env.params-manager": "dev/environment/ParamsManager",
        "env.history-manager": "dev/environment/HistoryManager",
        "env.languages.en": "dev/environment/languages/language.eng",


        /* libs */
        "lib.d3": "dev/libs/d3/js/d3.v3.new",
        "lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "lib.jquery-ui": "dev/libs/jquery/jquery-ui.min",
        "lib.tree-map": "dev/libs/TreeMap",
        "lib.date-format": "dev/libs/dateFormat",
        "lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "lib.socket-io": "dev/libs/socket.io",
        "lib.bootstrap-table": "dev/libs/bootstrap-table/bootstrap-table.min",
        "lib.jquery-amd": "dev/libs/jquery-libs-amd",
        "lib.jquery-libs": "dev/libs/jquery-libs",


        "lib.d3-magnetic-cursor": "dev/libs/d3-magnetic-cursor",


        /* model */


        /* view */
        "view.main": "dev/view/MainView",
        "view.chart.singleProbe": "dev/view/ChartSingleProbeView",
        "view.chart.multiProbe": "dev/view/ChartMultiProbeView",
        "view.chart.comparison": "dev/view/ChartComparisonView",

        "view.viewport": "dev/view/ViewPort",
        "view.chartManager": "dev/view/ChartManager",
        "view.templateManager": "dev/view/TemplateManagerView",
        "view.timeOverview": "dev/view/TimeOverviewView",

        /* view.svg */
        "view.svg.chart": "dev/view/svg/SvgChartView",


        /* model*/
        "model.group": "dev/model/Group",

        /* controller */
        "controller.gesture-manager": "dev/controller/GesturesManager",
        "controller.group-manager": "dev/controller/GroupManager",
        "controller.url-manager": "dev/controller/UrlManager",
        "controller.main": "dev/controller/main",

        /* data manipulation */
        "filter.relative-rtt": "dev/filter/RelativeRTTFilter",
        "filter.natural-rtt": "dev/filter/NaturalRTTFilter",


        /* connector */
        "connector.facade": "dev/connector/ConnectorFacade",
        "connector.history": "dev/connector/HistoryConnector",
        "connector.history-auto": "dev/connector/HistoryConnectorAutoResolution",
        "connector.live": "dev/connector/LiveConnector",
        "connector.translate-to-ping": "dev/connector/TranslateToPing",


        /* session */
        //"session.facade": LATENCYMON_SESSION_URL + "SessionManager"
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
        }

    },

    optimize: "uglify2",//uglify2
    wrapShim: true,
    generateSourceMaps: true,

    out: "latencymon-dist.js"


})