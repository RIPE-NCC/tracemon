({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){define.amd=false;",
        end: "});"
    },

    include: [
        "latencymon.lib.jquery",
        "latencymon.lib.jquery-ui",
        "latencymon.lib.jquery-ui.timepicker",
        "latencymon.lib.bootstrap",
        "latencymon.lib.bootstrap-table",
        "tracemon.lib.bootstrap-slider"
    ],

    paths:{
        "latencymon.lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "latencymon.lib.jquery-ui": "dev/libs/jquery/jquery-ui.min",
        "latencymon.lib.jquery-ui.timepicker": "dev/libs/jquery/jquery-ui.timepicker",
        "latencymon.lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "tracemon.lib.bootstrap-slider": "dev/libs/bootstrap-slider",
        "latencymon.lib.bootstrap-table": "dev/libs/bootstrap-table/bootstrap-table.min"
    },

    optimize: "uglify2",
    wrapShim: false,
    out: "dev/libs/jquery-libs.js"

})