/**
 * Created by mcandela on 05/11/13.
 */

define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.d3-amd",
    "tracemon.controller.header",
    "tracemon.lib.stache!main",
    "tracemon.lib.stache!search",
    "tracemon.lib.stache!select-view",
    "tracemon.lib.stache!probes-selection"
], function(utils, config, lang, $, d3, HeaderController, template, search, selectView, probesSelection){

    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){
        var $this, lineFunction, blockListeners, headerController, firstDraw;

        $this = this;
        firstDraw = true;
        this.lang = lang;
        this.env = env;
        this.values = {};
        this.dom = {};
        blockListeners = false;
        lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        this.selectionDataset = {
            outcome: {
                text:'Outcome',
                order: 2,
                children: [
                    {id: 'outcomereached', text: 'Target reached'},
                    {id: 'outcomenot-reached', text: 'Target not reached '}
                ]
            }
        };

        this.setListeners = function(){
            utils.observer.subscribe("view.status:change", this.updateTemplatesInfo, this);
            utils.observer.subscribe("view:probe-set", this.updateSearchBox, this);
            utils.observer.subscribe("model.history:new", this.updateTimeline, this);
            utils.observer.subscribe("model.history:change", this.updateTimeline, this);
            utils.observer.subscribe("view.time-selection:change", this.updateTimeline, this);
            utils.observer.subscribe("view.traceroute:click", this.showTraceroute, this);
        };


        this.getSelectionDataset = function(){
            var out = [];

            this.selectionDataset.source = {
                text: 'Source',
                order: 1,
                children: $.map(env.main.shownSources, function (probeId) {
                    return { id: 'source' + probeId, text: 'Probe ' + probeId };
                })
            };

            this.selectionDataset.as = {
                text:'ASN',
                order: 2,
                children:
                    $.map(env.connector.getASes(), function(asObj){
                        return {id: 'as' + asObj.number, label: 'AS' + asObj.number, text: 'AS' + asObj.number + " - " + asObj.holder};
                    })
            };

            for (var part in this.selectionDataset){
                out.push(this.selectionDataset[part]);
            }

            return out;
        };

        this.updateTemplatesInfo = function(){
            if (firstDraw){
                firstDraw = false;
                this.updateSearchBox();
            }

            if (!blockListeners) {
                this.values.target = this.getMonitoredTargets();
                this.values.totalProbes = Object.keys(env.connector.loadedProbes).length;
                this.values.numberProbes = env.main.shownSources.length;
                this.values.probes = env.main.shownSources;

                env.parentDom.find('.value-target').text(this.values.target);
                env.parentDom.find('.value-number-probes').text(this.values.numberProbes);
                env.parentDom.find('.value-total-probes').text(this.values.totalProbes);
            }
        };


        this.updateSearchBox = function(){
            if (this.searchField){
                this.searchField.select2("destroy").empty();
            } else {
                this.searchField = env.parentDom
                    .find(".search-box-field");
            }

            this.searchField
                .select2({
                    debug: true,
                    tags: "true",
                    placeholder: "Focus on",
                    allowClear: true,
                    data: this.getSelectionDataset(),
                    templateSelection: function(item){
                        return item.label || item.text;
                    }
                })
                .on("change", function (value) {
                    headerController.search($(this).val());
                })
                .trigger('change.select2');
        };


        this.getMonitoredTargets = function () {
            var targets = [];

            for (var msmKey in env.main.loadedMeasurements){
                targets.push(env.main.loadedMeasurements[msmKey].target.ip);
            }

            return targets.join(",");
        };

        this.maxPossibleHops = function(){
            return 15; // Compute the maximum number of hops for the loaded traceroute
        };

        // This metod is used by the mustache template
        this.getViews = function(){
            return Object.keys(lang.views)
                .map(function(key) {
                    return lang.views[key];
                })
        };

        // This metod is used by the mustache template
        this.getViewLabel = function () {
            return lang.views[env.viewName];
        };

        this._updateSetOfProbes = function (probeSet) {
            env.main.setSources(probeSet);
        };

        this.populateProbeList = function(data){
            var table, parent;

            parent = env.parentDom.find(".add-probe-panel");
            parent.show();

            table = parent.find('.probe-list');


            if (table.is(".table-condensed")) {
                table.bootstrapTable('load', data)
            } else {

                parent
                    .find(".close-panel")
                    .on("mouseup", function () {
                        parent.fadeOut();
                    });

                parent
                    .find(".add-probe")
                    .on("mouseup", function () {
                        var probeSet = $.map(
                            env.parentDom.find('.probe-list').bootstrapTable('getSelections'),
                            function (probe) {
                                return probe.id;
                            });

                        $this._updateSetOfProbes(probeSet);
                        parent.fadeOut();
                    });

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
                        onCheckAll: function () {
                            var groupName;

                            groupName = env.parentDom.find(".group-name>input");
                            if (groupName.is(":visible")) {
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
                            }

                            // , {
                            //     field: 'measurements',
                            //     sortable: true,
                            //     title: 'Measurement ID'
                            // }
                        ],
                        data: data
                    });
            }


            for (var n = 0, length = data.length; n < length; n++) {
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
            var html, partials;

            this.setListeners();
            partials = {
                "search": search(this),
                "select-view": selectView(this),
                "probes-selection": probesSelection(this)
            };

            html = $(template(this, partials));
            env.parentDom.html(html);
            this.dom.svg = html.find(".tracemon-svg");

            headerController = new HeaderController(env);
            env.headerController = headerController;

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

                    headerController.setReplaySpeed(slideEvt.value);
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
                    value: env.maxNumberHops,
                    step: 1,
                    min: 1,
                    max: this.maxPossibleHops()
                })
                .on("slide", function(slideEvt) {
                    $(slideEvt.target)
                        .closest(".bootstrap-slider")
                        .find(".value-slider")
                        .text(slideEvt.value);
                    headerController.setMaxHop(slideEvt.value);
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
                    $this.populateProbeList($.map(env.connector.loadedProbes, function(probe){
                        probe.select = (env.main.shownSources.indexOf(probe.id) != -1);
                        return [probe];
                    }));
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