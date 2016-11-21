/**
 * Created by mcandela on 05/11/13.
 */

define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.lib.stache!main",
    "tracemon.lib.stache!search",
    "tracemon.lib.stache!select-view",
    "tracemon.lib.stache!probes-selection"
], function(utils, config, lang, $, d3, template, search, selectView, probesSelection){

    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){
        var $this, lineFunction, blockListeners;

        $this = this;
        this.lang = lang;
        this.env = env;
        this.values = {};
        this.dom = {};
        this.loadedProbes = [];
        blockListeners = false;
        lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        this.setListeners = function(){
            utils.observer.subscribe("draw", this.updateTemplatesInfo, this);
            utils.observer.subscribe("updates-history", this.updateTimeline, this);
            utils.observer.subscribe("update-time-range", this.updateTimeline, this);
            utils.observer.subscribe("traceroute-clicked", this.showTraceroute, this);
        };


        this.updateTemplatesInfo = function(){
            if (!blockListeners) {
                this.values.target = "google.it";
                this.values.totalProbes = env.connector.loadedProbes.length;
                this.values.numberProbes = this.values.numberProbes || Object.keys(env.mainView.shownSources).length;

                env.parentDom.find('.value-target').text($this.getMonitoredTargets());
                env.parentDom.find('.value-number-probes').text($this.values.numberProbes);
                env.parentDom.find('.value-total-probes').text($this.values.totalProbes);
            }
        };

        this.getMonitoredTargets = function () {
            return "TODO"; // TODO
        };

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


        this.populateProbeList = function(data){
            var table, parent;

            this.loadedProbes = data;
            parent = env.parentDom.find(".add-probe-panel");
            table = parent.find('.probe-list');

            parent.show();
            parent
                .find(".close-panel")
                .on("mouseup", function(){
                    parent.fadeOut();
                });

            parent
                .find(".add-probe")
                .on("mouseup", function(){
                    var probeSet = $.map(
                        env.parentDom.find('.probe-list').bootstrapTable('getSelections'),
                        function(probe){
                            return probe.id;
                        });

                    $this.values.numberProbes = probeSet.length;
                    utils.observer.publish("probe-set-changed", probeSet);
                    parent.fadeOut();
                });

            if (table.is(".table-condensed")){
                table.bootstrapTable('load', data)
            } else {
                table
                    .addClass("table-condensed")
                    .bootstrapTable({
                        striped: true,
                        clickToSelect: true,
                        checkboxHeader: true,
                        sortOrder: "desc",
                        sortName: "name",
                        pagination: true,
                        showPaginationSwitch: false,
                        pageSize: 8,
                        pageList: [],
                        maintainSelected: true,
                        smartDisplay: true,
                        sidePagination: "client",
                        dataShowPaginationSwitch: true,
                        showFooter: false,
                        sortable: true,
                        search: true,
                        checkedBooleanField: "checked",
                        onCheckAll: function(){
                            var groupName;

                            groupName = env.parentDom.find(".group-name>input");
                            if (groupName.is(":visible")){
                                groupName.val(env.parentDom.find(".search > input").val()).trigger("keyup");
                            }
                        },
                        columns: [
                            {
                                field: 'select',
                                title: 'Select',
                                checkbox: true
                            },
                            {
                                field: 'id',
                                title: 'Probe ID',
                                sortable: true
                            }, {
                                field: 'cc',
                                sortable: true,
                                title: 'Country'
                            }, {
                                field: 'asv4',
                                sortable: true,
                                title: 'ASv4'
                            }, {
                                field: 'asv6',
                                sortable: true,
                                title: 'ASv6'
                            }, {
                                field: 'ipv4',
                                sortable: true,
                                title: 'IPv4'
                            }, {
                                field: 'ipv6',
                                sortable: true,
                                title: 'IPv6'
                            }, {
                                field: 'msmid',
                                sortable: true,
                                title: 'Measurement ID'
                            }
                        ],
                        data: data
                    });
            }


            for (var n=0,length=data.length; n<length; n++){
                var element;

                element = table
                    .find("tr[data-index]").find("td:eq(1):contains('" + data[n].id + "')")
                    .closest("tr[data-index]");

                if (data[n].empty) {
                    element
                        .addClass("empty-probe");
                } else {
                    element
                        .removeClass("empty-probe");
                }

            }

        };


        this.updateTimeline = function(){
            var timeRange;

            if (!blockListeners) {
                timeRange = env.historyManager.getTimeRange();

                if (this.timeline) {
                    this.timeline
                        .data("ionRangeSlider")
                        .update({
                            min: moment.unix(env.meta.startDate).utc().unix(),
                            max: ((env.meta.stopDate) ? moment.unix(env.meta.stopDate).utc().unix() : moment().utc().unix()),
                            from: timeRange.startDate,
                            to: timeRange.stopDate
                        });
                } else {
                    this.timeline = env.parentDom
                        .find(".timeline-controller")
                        .ionRangeSlider({
                            type: "double",
                            min: moment.unix(env.meta.startDate).utc().unix(),
                            max: ((env.meta.stopDate) ? moment.unix(env.meta.stopDate).utc().unix() : moment().utc().unix()),
                            from: timeRange.startDate,
                            to: timeRange.stopDate,
                            grid: true,
                            prettify: function (num) {
                                return moment.unix(num).utc().format("Do MMMM, HH:mm");
                            },
                            onFinish: function (data) {
                                var width = env.parentDom.width();
                                $this.updateTimeSelectionCone([((width / 100) * data.from_percent) + 40, ((width / 100) * data.to_percent) + 40]); //Yes, 40 is arbitrary, I got bored to find out why
                                blockListeners = true;
                                env.main.setTimeRange(moment.unix(data.from).utc().unix(), moment.unix(data.to).utc().unix());
                                blockListeners = false;
                            },
                            onStart: function (data) {
                                var width = env.parentDom.width();
                                $this.updateTimeSelectionCone([((width / 100) * data.from_percent) + 40, ((width / 100) * data.to_percent) + 40]);
                            }
                        });
                }
            }
        };


        this.init = function() {
            var html, partials, timeRange;

            this.setListeners();
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
                .find(".close-traceroute")
                .on("click", function () {
                    env.parentDom
                        .find(".traceroute-output") // optimise this!
                        .hide();

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

            env.parentDom
                .find(".select-view li")
                .click(function(){
                    var option = $(this);
                    option
                        .closest(".select-view")
                        .find('.dropdown-toggle')
                        .html(option.text() + ' <span class="caret"></span>');
                });

            env.parentDom
                .find(".click-select-probe")
                .on("click", function(){
                    $this.populateProbeList(env.connector.loadedProbes);
                });

            this.tracerouteDivDom = env.parentDom
                .find(".traceroute-output")
                .hide();

            this.timeSelectionCone = d3.select(env.parentDom[0])
                .select(".time-selection-cone");

            this.timeSelectionConeLeft = this.timeSelectionCone
                .append("path")
                .attr("class", "cone-time-boundaries");


            this.timeSelectionConeRight = this.timeSelectionCone
                .append("path")
                .attr("class", "cone-time-boundaries");

        };


        this.updateTimeSelectionCone = function (points) {
            var height, width, margin;

            height = 50;
            margin = { left: 0, right: 0 };
            width = env.parentDom.width() - margin.left - margin.right;

            this.timeSelectionConeRight
                .attr("d", lineFunction([
                    {x: width + margin.left, y: height},
                    {x: points[1], y: height},
                    {x: width + margin.left, y: 0}
                ]));

            this.timeSelectionConeLeft
                .attr("d", lineFunction([
                    {x: margin.left, y: 0},
                    {x: points[0], y: height},
                    {x: margin.left, y: height}
                ]));
        };


        this.showTraceroute = function(traceroute){
            this.tracerouteDivDom.show();
            this.tracerouteDivDom.find("textarea")
                .text(traceroute.toString());
        }

    };


    return TemplateManagerView;
});