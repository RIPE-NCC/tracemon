/**
 * Created by mcandela on 05/11/13.
 */

define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.stache!main",
    "tracemon.lib.stache!search",
    "tracemon.lib.stache!select-view",
    "tracemon.lib.stache!probes-selection"
], function(utils, config, lang, $, template, search, selectView, probesSelection){

    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){

        this.lang = lang;
        this.env = env;
        this.values = {};
        this.dom = {};

        this.values.target = "dominio";
        this.values.numberProbes = 15;
        this.values.totalProbes = 50;

        this.maxPossibleHops = function(){
            return 15; // Compute the maximum number of hops for the loaded traceroute
        };

        this.getViews = function(){
            return Object.keys(lang.views)
                .map(function(key) {
                    return lang.views[key];
                })
        };

        this.getViewLabel = function () {
            return lang.views[env.viewName];
        };

        this.init = function() {
            var html, partials;

            partials = {
                "search": search(this),
                "select-view": selectView(this),
                "probes-selection": probesSelection(this)
            };

            html = $(template(this, partials));
            env.parentDom.html(html);
            this.dom.svg = html.find(".tracemon-svg");

            env.parentDom
                .find('.reproduction-speed>input')
                .slider({
                    value: env.reproductionSpeed,
                    step: 1,
                    min: 1,
                    max: config.maxReproductionSpeed
                })
                .on("slide", function(slideEvt) {

                    $(slideEvt.target)
                        .closest(".bootstrap-slider")
                        .find(".value-slider")
                        .text(slideEvt.value);
                });

            env.parentDom
                .find('.hops-number>input')
                .slider({
                    value: [1, env.maxNumberHops],
                    step: 1,
                    min: 1,
                    max: this.maxPossibleHops()
                })
                .on("slide", function(slideEvt) {
                    $(slideEvt.target)
                        .closest(".bootstrap-slider")
                        .find(".value-slider")
                        .text(slideEvt.value[0] + '-' + slideEvt.value[1]);
                });

            $(".select-view")
                .find("li")
                .click(function(){
                    var option = $(this);
                    option
                        .closest(".select-view")
                        .find('.dropdown-toggle')
                        .html(option.text() + ' <span class="caret"></span>');
                });

        };

        this.init();

    };


    return TemplateManagerView;
});