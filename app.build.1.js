({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){define.amd=false;",
        end: "});"
    },

    include: [
        "tracemon.lib.jquery",
        "tracemon.lib.jquery-ui",
        "tracemon.lib.jquery-ui.timepicker",
        "tracemon.lib.bootstrap",
        "tracemon.lib.bootstrap-table",
        "tracemon.lib.bootstrap-slider",
        "tracemon.lib.bootstrap-select",
        "tracemon.lib.range-slider"
    ],

    paths: {
        "tracemon.lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "tracemon.lib.jquery-ui": "dev/libs/jquery/jquery-ui.min",
        "tracemon.lib.jquery-ui.timepicker": "dev/libs/jquery/jquery-ui.timepicker",
        "tracemon.lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "tracemon.lib.bootstrap-slider": "dev/libs/bootstrap-slider/js/bootstrap-slider",
        "tracemon.lib.bootstrap-table": "dev/libs/bootstrap-table/bootstrap-table.min",
        "tracemon.lib.bootstrap-select": "dev/libs/bootstrap-select/js/bootstrap-select",
        "tracemon.lib.range-slider": "dev/libs/range-slider/js/ion.rangeSlider"
    },

    optimize: "uglify2",
    wrapShim: false,
    out: "dev/libs/jquery-libs.js"

})