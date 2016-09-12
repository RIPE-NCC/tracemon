/**
 * Created by mcandela on 05/11/13.
 */

define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.stache!main",
    "tracemon.lib.stache!search"
], function(utils, config, lang, $, template, search){

    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){
        var templates, templatesLocation;

        templatesLocation = env.templatesLocation;
        templates = {
            main: templatesLocation + "main.html"
        };

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

        this.init = function() {
            var html, partials;

            partials = {
                "search": search(this)
            };

            html = $(template(this, partials));
            env.parentDom.html(html);
            this.dom.svg = html.find(".tracemon-svg");

            env.parentDom
                .find('.bootstrap-slider  input')
                .slider({
                    step: 1,
                    min: 0,
                    max: 10,

                    formatter: function(value) {
                        // console.log(value);
                        return parseInt(value);
                    }
                })
                .on("slide", function(slideEvt) {
                    $(slideEvt.target)
                        .closest(".right-controller")
                        .find(".value-slider")
                        .html(slideEvt.value[0] + '-' + slideEvt.value[1]);
                });


        };

        this.init();

    };


    return TemplateManagerView;
});