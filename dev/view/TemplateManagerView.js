/**
 * Created by mcandela on 05/11/13.
 */

define([
    "latencymon.env.utils",
    "latencymon.env.config",
    "latencymon.env.languages.en",
    "latencymon.lib.jquery-amd"
], function(utils, config, lang, $){

    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){
        var widgetUrl, slidingMenuOpened, insideSubMenu, $this, loadingImageCounter, loadingImageTimer, startDatepicker,
            stopDatepicker;

        widgetUrl = env.widgetUrl;
        $this = this;
        loadingImageCounter = 0;

        this.loadingImage = '<img src="' + widgetUrl + 'view/img/loading2.gif" class="loading-image"/> ';

        this.overlayMessage = '<div class="error-message"></div>';

        this.infoHeader = {
            container: $('<div class="info-header"></div>'),
            left: $('<div class="left-info"></div>'),
            right: $('<div class="right-info"></div>')
        };

        this.infoHeader.container
            .append(this.infoHeader.left)
            .append(this.infoHeader.right);

        this.streamingLed = {
            label: $('<div class="streaming-label" title="' + lang.streamingInfo + '"></div>'),
            $: $('<div class="led-green streaming-led" title="' + lang.streamingInfo + '"></div>'),
            blink: function(){
                this.$.css({"animation": "none"});
                this.$.width(this.$.width());
                this.$.css({"animation": "blinkGreen 1s"});
            },
            on: function(){
                if (!this.appended) {
                    env.parentDom.find(".led-box").append(this.$).after(this.label);
                    this.appended = true;
                }
                this.label.text("Streaming on");
                this.$.removeClass("led-red").addClass("led-green")
            },
            off: function(){
                if (!this.appended) {
                    env.parentDom.find(".led-box").append(this.$).after(this.label);
                    this.appended = true;
                }
                this.label.text("Streaming off");
                this.$.removeClass("led-green").addClass("led-red")
            }
        };

        this.controlPanel =
            '<div class="button-group">' +
            '<div class="control-panel left-bar">' +

            '<div class="button open-add-measurement-panel" title="' + lang.addMeasurement + '">' +
            '<img src="' + widgetUrl + 'view/img/add_measurement.png"/>' +
            '</div>' +

            '<div class="button open-add-line-panel" title="' + lang.addLineIcon + '">' +
            '<img src="' + widgetUrl + 'view/img/add-line.png"/>' +
            '</div>' +

            '<div class="button open-add-group-panel" title="' + lang.addGroupIcon + '">' +
            '<img src="' + widgetUrl + 'view/img/add-group.png"/>' +
            '</div>' +

            '</div>' +

            '<div class="control-panel right-bar">' +

            '<div class="button forward" title="' + lang.forwardTitle + '">' +
            '<img src="' + widgetUrl + 'view/img/dnsmon_forward_icon.png"/>' +
            '</div>' +

            '<div class="button right" title="' + lang.shiftRightTitle + '">' +
            '<img src="' + widgetUrl + 'view/img/right_icon.png"/>' +
            '</div>' +

            '<div class="button zoom-in" title="' + lang.zoomInTitle + '">' +
            '<img src="' + widgetUrl + 'view/img/zoomin_icon.png"/>' +
            '</div>' +

            '<div class="button zoom-out" title="' + lang.zoomOutTitle + '">' +
            '<img src="' + widgetUrl + 'view/img/zoomout_icon.png"/>' +
            '</div>' +

            '<div class="button left" title="' + lang.shiftLeftTitle+ '">' +
            '<img src="' + widgetUrl + 'view/img/left_icon.png"/>' +
            '</div>' +

            '<div class="button timepicker">' +
            '<img src="' + widgetUrl + 'view/img/calendar_icon.png"/>' +
            '</div>' +

            '<div class="button chart-mode relative" title="' + lang.chartModeTitle.relative + '">' +
            '<img src="' + widgetUrl + 'view/img/chart_mode.png"/>' +
            '</div>' +

                //'<div class="button filters">' +
                //'<img src="' + widgetUrl + 'view/img/filter_icon.png"/>' +
                //'</div>' +

                //'<div class="button full-screen">' +
                //'<img src="' + widgetUrl + 'view/img/dnsmon_fullscreen_icon.png"/>' +
                //'</div>' +
            '</div>' +
            '<div class="led-box"></div>' +
            '</div>';



        this.slidingMenu = $('<div class="sliding-panel">' +
            '</div>');

        this.getLastData = $(function(){
            var out = "";
            for (var key in config.predefinedTimeWindows){
                out += "<div>" + key + "</div>"
            }
            return out;
        }());

        this.timepickersPopup =
            '<div style="float: left;">' + lang.startDateLabel + ' <br/><input type="text" class="timepicker-start date-field" /></div>' +
            '<div style="position: absolute; top: 15px; left: 145px;"><img style="" src="' + widgetUrl + 'view/img/double_arrow.gif" /></div>' +
            '<div style="float: right;">' + lang.endDateLabel + ' <br/><input type="text" class="timepicker-stop date-field" /></div>';



        this.timeOverview = $('<div class="time-overview-dom"></div>');
        this.footer = $('<div class="latencymon-footer"></div>');


        this.footer.append('<div class="latencymon-about footer-item"><a href="' + config.aboutUrl + '" title="' + lang.about + '">' + lang.about + '</a></div>');
        this.footer.append('<div class="latencymon-embed footer-item"><a href="' + config.embedCodeUrl + '" title="' + lang.embedCode + '">' + lang.embedCode + '</a></div>');
        this.footer.append('<div class="latencymon-documentation footer-item"><a href="' + config.documentationUrl + '" title="' + lang.documentation + '">' + lang.documentation + '</a></div>');

        if (utils.getUrlParam("info") == "true") {
            this.footer.append('<div class="latencymon-version footer-item">Version:' + env.version + '</div>');
            this.footer.append(atob("PGRpdiBjbGFzcz0ibGF0ZW5jeW1vbi1jb3B5cmlnaHQgZm9vdGVyLWl0ZW0iPkF1dGhvcjogPGEgaHJlZj0iaHR0cDovL21hc3NpbW9jYW5kZWxhLmNvbSI+TWFzc2ltbyBDYW5kZWxhPC9hPjwvZGl2Pg=="));
        }

        this.dialog = $('<div class="probe-info-dialog dropdown-panel" style="height: 400px;">' +
            '<div class="header-dropdown-panel" style="width: 70%;"></div>' +
            '<div class="content-dropdown-panel"></div>' +
            '<div class="footer-dropdown-panel">' +
            '<button type="button" class="btn btn-default probe-dialog-close">Close</button>' +
            '<button type="button" class="btn btn-success probe-dialog-ok">Ok</button>' +

            '</div>' +
            '</div>');


        this.addLinePanel = $('<div class="add-line-panel dropdown-panel" style="height: 400px;">' +
            '<div class="header-dropdown-panel" style="width: 70%;"></div>' +
            '<div class="content-dropdown-panel"><table class="probe-list"></table></div>' +
            '<div class="footer-dropdown-panel">' +
            '<div class="group-name">Group name: ' +
            '<input type="text" class="form-control" placeholder="Group name"></div>' +
            '<button type="button" class="btn btn-default add-line-panel-close">Cancel</button>' +
            '<button type="button" class="btn btn-success add-line"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add</button>' +
            '<button type="button" class="btn btn-success add-comparison"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Compare</button>' +
            '<button type="button" class="btn btn-success add-group"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Group</button>' +
            '</div>' +
            '</div>');

        this.addMeasurementPanel = $('<div class="dropdown-panel" style="height: 160px; width: 500px">' +
            '<div class="header-dropdown-panel">' + lang.addMeasurementHeader+ '</div>' +
            '<div class="content-dropdown-panel">' +
            '<input type="text" class="form-control measurement-id" placeholder="Measurement ID"></div>' +
            '<div class="footer-dropdown-panel">' +
            '<button type="button" class="btn btn-default add-measurement-panel-close">Cancel</button>' +
            '<button type="button" class="btn btn-success add-measurement-submit"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add</button>' +
            '</div>' +
            '</div>');


        this.dom = {};

        env.parentDom.addClass("latencymon-container");
        this.dom.main = $("<div></div>").addClass("latencymon-content").appendTo(env.parentDom);

        this.dom.loadingImage = $(this.loadingImage).appendTo(this.dom.main);

        this.dom.message = $(this.overlayMessage).appendTo(this.dom.main);



        this._moveLoadingImage = function(evt){
            $this.dom.loadingImage
                .css({
                    "left": evt.pageX - $(this).offset().left,
                    "top": evt.pageY - $(this).offset().top
                });
        };


        this.updateInfo = function(){
            var leftHeaderContent, groupsNumber, measurementsNumber, targets;

            targets = [];
            leftHeaderContent = lang.leftHeader.noMeasurement;
            measurementsNumber = (env.measurements) ? Object.keys(env.measurements).length : 0;
            groupsNumber = (env.main.groups) ? Object.keys(env.main.groups).length : 0;

            if (groupsNumber == 0){
                leftHeaderContent = lang.leftHeader.noGroups;
            }

            if (measurementsNumber == 1 && groupsNumber > 0){

                for (var msmId in env.measurements){
                    leftHeaderContent = lang.leftHeader.show
                        .replace("%y", utils.htmlEncode(env.measurements[msmId].type))
                        .replace("%m", utils.htmlEncode(msmId))
                        .replace("%t", utils.htmlEncode(env.measurements[msmId].target));
                    break;
                }
            }

            if (measurementsNumber > 1 && groupsNumber > 0){
                for (var msmId in env.originalMeasurements){
                    targets.push(env.originalMeasurements[msmId].target);
                }
            }

            this.infoHeader.left.text(leftHeaderContent);
            this.infoHeader.right.text(lang.rightHeader.replace("%s", utils.dateToStringShort(utils.UTCDateToLocalDate(env.startDate))).replace("%e", utils.dateToStringShort(utils.UTCDateToLocalDate(env.endDate))));
        };


        this.showLoadingImage = function(show){
            if (show) {
                if (loadingImageCounter == 0) {
                    $($this.dom.main)
                        .on("mousemove", $this._moveLoadingImage);
                    $this.dom.loadingImage
                        .css({
                            "left": "50%",
                            "top": "50%"
                        })
                        .show();

                    if (loadingImageTimer){
                        clearTimeout(loadingImageTimer);
                    }
                    loadingImageTimer = setTimeout(function(){ // Stop with the loading Image, it was a timeout
                        $this.dom.loadingImage.hide();
                        loadingImageCounter = 0;
                    }, 20000);
                }
                loadingImageCounter++;
            } else {
                loadingImageCounter--;
                if (loadingImageCounter == 0) {
                    if (loadingImageTimer){
                        clearTimeout(loadingImageTimer);
                    }
                    $this.dom.loadingImage.hide();
                    $($this.dom.main)
                        .off("mousemove", $this._moveLoadingImage);
                }
            }
        };


        this.bindSlidingMenu = function(callerButton, menuItemsHtml, height, cssClass, callback){
            var timerHide;

            if (insideSubMenu == null){
                this.dom.main.append($this.slidingMenu); // Append the sub menu dom
                slidingMenuOpened = false;
                insideSubMenu = false;

                this.slidingMenu
                    .on("mouseenter", function(){
                        insideSubMenu = true;
                    })
                    .on("mouseleave", function(evt){
                        insideSubMenu = false;
                        if ($(evt.target).attr('class') == $this.slidingMenu.attr('class')){
                            hideSubMenu();
                        }
                    });
            }

            function hideSubMenu(){
                if (insideSubMenu == false){
                    $this.slidingMenu
                        .removeClass(cssClass)
                        .off("click")
                        .hide()
                        .css({
                            height: "0"
                        });
                    slidingMenuOpened = false;
                    //env.parentDom.$.tooltip("enable");
                }
            }

            callerButton
                .on("mouseenter",
                function(){
                    if (slidingMenuOpened == false){
                        clearTimeout(timerHide);
                        slidingMenuOpened = true;
                        $this.slidingMenu.html(menuItemsHtml);

                        $this.slidingMenu
                            .on("click", callback)
                            .addClass(cssClass)
                            .css({
                                left: Math.ceil(callerButton.position().left),
                                top: callerButton.position().top + 20
                            })
                            .show()
                            .animate({
                                height: height
                            }, 300);

                        //env.parentDom.$.tooltip("disable");
                    }
                })
                .on("mouseleave", function(){
                    clearTimeout(timerHide);
                    timerHide = setTimeout(hideSubMenu, 1000);
                });


        };


        this.populateProbeList = function(data){
            var table;

            table = env.parentDom.find('.probe-list');
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
                        //singleSelect: true,
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
        };


        this._openDialog = function(title, content, width, height, showOk, action){
            if (!this.dialogAppended) {
                this.dom.main
                    .append(this.dialog.hide().fadeIn());
                this.dialogAppended = true;
                this.dialog.find(".probe-dialog-close").on("mouseup", function(){
                    $this.dialog.fadeOut()
                });

            } else {
                this.dialog.fadeIn();
            }

            if (showOk) {
                this.dialog
                    .find(".probe-dialog-ok")
                    .off("mouseup")
                    .on("mouseup", function(){
                        action();
                        $this.dialog.fadeOut();
                    });
            } else {
                this.dialog
                    .find(".probe-dialog-ok")
                    .off("mouseup")
                    .hide();
            }

            this.dialog.css({
                width: width,
                height: height,
                "margin-left": -width/2
            });
            this.dialog.find(".content-dropdown-panel").html(content);
            this.dialog.find(".header-dropdown-panel").html(title);

            return this.dialog;
        };


        this.openProbeInfoDialog = function(probeId, groupId){
            var content, probeUrl, probe;

            probe = env.connector.getProbeInfo(probeId);
            probeUrl = config.probeInfoPageUrl.replace("%p", probeId);

            content = "";
            content += '<table class="table table-bordered table-striped table-info-probe">' +
                '<tr>' +
                '<td>ID:  ' + probe.id + ' </td>' +
                '<td>Country: ' + probe.country_code + ' </td>' +
                '</tr>' +

                '<tr>' +
                '<td>IP v4:  ' + probe.address_v4 + ' </td>' +
                '<td>IP v6: ' + probe.address_v6 + ' </td>' +
                '</tr>' +

                '<tr>' +
                '<td>Prefix v4:  ' + probe.prefix_v4 + ' </td>' +
                '<td>Prefix v6: ' + probe.prefix_v6 + ' </td>' +
                '</tr>' +


                '<tr>' +
                '<td>ASn v4:  ' + probe.asn_v4 + ' </td>' +
                '<td>ASn v6: ' + probe.asn_v6 + ' </td>' +
                '</tr>' +
                '</table>';

            content += '<div class="">More info about this probe:<a target="blank" href="' + probeUrl + '"> ' + probeUrl + '</a></div>';
            content += 'This probe is part of the chart "' + groupId + '".';
            content += '<span data-probe-id="' + probeId + '" data-group-id="' + groupId + '" class="isolate-probe"> <a>Isolate from this chart.</a></span>';

            this._openDialog(lang.titleProbeInfoDialog, content, 700, 300, false, null);
        };



        this.openTimeRangeCalendarDialog = function(){
            var content, dialog;

            content = '<div style="clear: both;">' +
                '<div style="float: left;">Start date: <br><input type="text" value="" class="timepicker-start date-field"></div>' +
                '<div style="float: right;">End date: <br><input type="text" value="" class="timepicker-stop date-field"></div>' +
                '</div>';

            dialog = this._openDialog(lang.titleSelectTimeRange, content, 500, 200, true, function(){
                var startDate, endDate;

                startDate = startDatepicker.datetimepicker('getDate');
                endDate = stopDatepicker.datetimepicker('getDate');

                env.main.setTimeRange(startDate, endDate);
            });

            startDatepicker = dialog.find(".timepicker-start");
            stopDatepicker = dialog.find(".timepicker-stop");

            startDatepicker.datetimepicker({
                minDate: env.timeDomain[0],
                maxDate: env.timeDomain[1],
                dateFormat: "yy-mm-dd",
                beforeShow: function(){
                    $('#ui-datepicker-div').addClass('default-text');
                },
                onClose: function(){
                    $('#ui-datepicker-div').removeClass('default-text');
                }
            });

            stopDatepicker.datetimepicker({
                minDate: env.timeDomain[0],
                maxDate: env.timeDomain[1],
                dateFormat: "yy-mm-dd",
                beforeShow: function(){
                    $('#ui-datepicker-div').addClass('default-text');
                },
                onClose: function(){
                    $('#ui-datepicker-div').removeClass('default-text');
                }
            });

            startDatepicker.datepicker("setDate", env.startDate);
            stopDatepicker.datepicker("setDate", env.endDate);
        };


        this._openAddMenu = function(isGroup){
            var probe, data, drawn;

            if (!this.addLinePanelAppended) {
                this.dom.main
                    .append(this.addLinePanel.hide().fadeIn());
                this.addLinePanelAppended = true;

                env.parentDom.find(".add-line-panel-close").on("mouseup", function(){
                    $this.addLinePanel.fadeOut()
                });

                env.parentDom.find(".add-line")
                    .on("mouseup", function(){
                        $.each(env.parentDom.find('.probe-list').bootstrapTable('getSelections'), function(i, item){
                            env.main.addProbe(item.msmid, item.id);
                        });
                        $this.addLinePanel.fadeOut();
                    });


                env.parentDom.find(".add-group")
                    .on("mouseup", function(){
                        var groups, groupName;

                        groups = {};
                        groupName = env.parentDom.find(".group-name>input").val();

                        if (config.groupNameRegex.test(groupName)){ // Check group name validity
                            $.each(env.parentDom.find('.probe-list').bootstrapTable('getSelections'), function(i, item){
                                if (!groups[item.msmid]){
                                    groups[item.msmid] = [];
                                }
                                groups[item.msmid].push(item.id);
                            });
                            for (var measurement in groups){
                                env.main.addGroup(measurement, groups[measurement], groupName, "multi-probes");
                            }

                            $this.addLinePanel.fadeOut();
                        } else {
                            env.main.error(lang.alert.notValidGroupName, "error");

                        }
                    });

                env.parentDom.find(".add-comparison")
                    .on("mouseup", function(){
                        var groups;

                        groups = {};
                        $.each(env.parentDom.find('.probe-list').bootstrapTable('getSelections'), function(i, item){
                            if (!groups[item.msmid]){
                                groups[item.msmid] = [];
                            }
                            groups[item.msmid].push(item.id);
                        });
                        for (var measurement in groups){
                            env.main.addGroup(measurement, groups[measurement], env.parentDom.find(".group-name>input").val(), "comparison");
                        }

                        $this.addLinePanel.fadeOut();
                    });

                env.parentDom.find(".group-name>input")
                    .on("keyup", function(){
                        if ($(this).val().length > 0){
                            env.parentDom.find(".add-group").prop("disabled", false);
                            env.parentDom.find(".add-comparison").prop("disabled", false);
                        } else {
                            env.parentDom.find(".add-group").prop("disabled", true);
                            env.parentDom.find(".add-comparison").prop("disabled", true);
                        }
                    });

            } else {
                this.addLinePanel.fadeIn();
            }

            this.addLinePanel
                .find(".header-dropdown-panel")
                .html(((isGroup) ? lang.selectGroupHeaderText : lang.selectLineHeaderText));

            function isDisplayed(measurementId, probe){
                for (var group in env.main.groups){

                    if (env.main.groups[group].measurementId == measurementId && env.main.groups[group].contains(probe)){
                        return true;
                    }
                }
                return false;
            }

            data = [];
            for (var measurementId in env.main.availableProbes){

                for (var probeId in env.main.availableProbes[measurementId]){

                    probe = env.main.availableProbes[measurementId][probeId];
                    drawn = isDisplayed(measurementId, probe);

                    if (!isGroup || !drawn){
                        data.push({
                            id: probe.id,
                            msmid: measurementId,
                            cc: probe.country_code,
                            asv4: probe.asn_v4,
                            asv6: probe.asn_v6,
                            ipv4: probe.address_v4,
                            ipv6: probe.address_v6,
                            checked: drawn
                        });
                    }
                }
            }

            if (isGroup){
                env.parentDom.find(".add-line").hide();
                env.parentDom.find(".group-name").show();
                env.parentDom.find(".add-group").prop("disabled", true).show();
                env.parentDom.find(".add-comparison").prop("disabled", true).show();
            } else {
                env.parentDom.find(".add-line").show();
                env.parentDom.find(".group-name").hide();
                env.parentDom.find(".add-group").hide();
                env.parentDom.find(".add-comparison").hide();
            }

            env.parentDom.find(".group-name>input").val("");

            $this.populateProbeList(data);
        };


        this.openAddLineMenu = function(){
            $this._openAddMenu(false);
            $this.addMeasurementPanel.hide();
        };

        this.openAddGroupMenu = function(){
            $this._openAddMenu(true);
            $this.addMeasurementPanel.hide();
        };

        this.openAddMeasurementPanel = function(){
            $this.addLinePanel.hide();
            if (!this.addMeasurementPanelAppended) {
                $this.dom.main
                    .append(this.addMeasurementPanel.hide().fadeIn());
                this.addMeasurementPanelAppended = true;

                env.parentDom.find(".add-measurement-panel-close")
                    .on("mouseup", function(){
                        $this.addMeasurementPanel.fadeOut();
                    });

                env.parentDom.find(".add-measurement-submit")
                    .on("mouseup", function(){
                        try {
                            env.main.addMeasurement(env.parentDom.find(".measurement-id").val());
                            $this.addMeasurementPanel.fadeOut();
                            env.main.error(lang.measurementAdded, "info");
                            $this.openAddLineMenu();
                        } catch(e) {
                            // A message is already shown, don't do anything
                        }
                    });



            } else {
                this.addMeasurementPanel.fadeIn();
            }

            env.parentDom.find(".measurement-id").val("");

        };


    };


    return TemplateManagerView;
});