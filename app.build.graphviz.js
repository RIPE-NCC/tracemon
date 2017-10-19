({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){" +
        "var module = {exports: {}};",
        end: "return function(){return module.exports};});"
    },

    include: [
        "tracemon.lib.graphViz"
    ],

    paths: {
        "tracemon.lib.graphViz": "dev/libs/viz"
    },

    optimize: "none",
    wrapShim: false,
    generateSourceMaps: false,
    out: "dev/libs/graphviz-amd.js"

})