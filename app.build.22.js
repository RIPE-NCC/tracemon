({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){define.amd=false;",
        end: "});"
    },

    include: ["latencymon.lib.d3", "latencymon.lib.d3-magnetic-cursor"],

    paths:{
        "latencymon.lib.d3": "dev/libs/d3/d3.v3.new",
        "latencymon.lib.d3-magnetic-cursor": "dev/libs/d3-magnetic-cursor",
    },

    optimize: "uglify2",
    wrapShim: false,
    out: "dev/libs/d3-libs.js"

})