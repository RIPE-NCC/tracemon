// RequireJS Mustache template plugin
// http://github.com/jfparadis/requirejs-mustache
//
// An alternative to https://github.com/millermedeiros/requirejs-hogan-plugin
//
// Using Mustache Logic-less templates at http://mustache.github.com
// Using and RequireJS text.js at http://requirejs.org/docs/api.html#text
// @author JF Paradis
// @version 0.0.3
//
// Released under the MIT license
// Usage:
//   require(['backbone', 'stache!mytemplate'], function (Backbone, mytemplate) {
//     return Backbone.View.extend({
//       initialize: function(){
//         this.render();
//       },
//       render: function(){
//         this.$el.html(mytemplate({message: 'hello'}));
//     });
//   });
//
// Configuration: (optional)
//   require.config({
//     stache: {
//       extension: '.stache' // default = '.html'
//     }
//   });

/*jslint nomen: true */
/*global define: false */

define(["tracemon.lib.text", "tracemon.lib.mustache"], function (text, Mustache) {

    var sourceMap = {},
        buildMap = {},
        buildTemplateSource = "define('{pluginName}!{moduleName}', ['mustache'], function (Mustache) { var template = '{content}'; Mustache.parse( template ); return function( view ) { return Mustache.render( template, view ); } });\n";

    return {
        version: '0.0.3',

        load: function (moduleName, parentRequire, onload, config) {
            if (buildMap[moduleName]) {
                onload(buildMap[moduleName]);

            } else {
                var ext = (config.stache && config.stache.extension) || '.html';
                var path = (config.stache && config.stache.path) || '';
                text.load(path + moduleName + ext, parentRequire, function (source) {
                    if (config.isBuild) {
                        sourceMap[moduleName] = source;
                        onload();
                    } else {
                        Mustache.parse(source);
                        buildMap[moduleName] = function( view, partials) {
                            return Mustache.render( source, view, partials);
                        };
                        onload(buildMap[moduleName]);
                    }
                }, config);
            }
        },

        write: function (pluginName, moduleName, write, config) {
            var source = sourceMap[moduleName],
                content = source && text.jsEscape(source);
            if (content) {
                write.asModule(pluginName + '!' + moduleName,
                    buildTemplateSource
                        .replace('{pluginName}', pluginName)
                        .replace('{moduleName}', moduleName)
                        .replace('{content}', content));
            }
        }
    };
});