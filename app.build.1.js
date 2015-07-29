({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){define.amd=false;",
        end: "});"
    },

    include: ["lib.jquery", "lib.jquery-ui", "lib.bootstrap", "lib.bootstrap-table"],

    paths:{
        "lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "lib.jquery-ui": "dev/libs/jquery/jquery-ui.min",
        "lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "lib.bootstrap-table": "dev/libs/bootstrap-table/bootstrap-table.min"
    },

    optimize: "uglify2",
    wrapShim: false,
    out: "dev/libs/jquery-libs.js"

})