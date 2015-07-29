/**
 * Created by mcandela on 20/11/13.
 */

define([
    "env.utils",
    "env.params-manager",
    "view.full-screen",
    "lib.jquery-ui.timepicker"
], function(utils, paramsManager, FullScreenView){

    /**
     * ControlPanelView is the view component managing the representation of the control panel
     *
     * @class ControlPanelView
     * @constructor
     * @module view
     */

    var ControlPanelView = function(env){
        var container, chart, thresholdsPopup, legendColors, legendPercentages, legendUnit, config, lang, templateManager,
            disabledOpacity, normalOpacity, filtersPopup, extraDataPopup, dnsResponseDom, tracerouteDom, lazyLoadTab2,
            autoUpdateButton, slidingMenu, insideSubMenu, slidingMenuOpened, fullScreenButton, hostBindResponseDom,
            lazyLoadTab3, lazyLoadTab1;

        config = env.config;
        lang = env.lang;
        container = env.container;
        chart = container.chart;
        templateManager = env.mainView.templateManager;

        disabledOpacity = config.style.disabledControllerOpacity;
        normalOpacity = config.style.normalControllerOpacity;
        this.dom = $(templateManager.controlPanel);


        /**
         * This method updates the width of this view
         *
         * @method updateWidth
         */

        this.updateWidth = function(){
            var margin;

            margin = 9;
            this.dom.css("width", env.container.chart.width() - margin + "px");
        };


        /**
         * This method renders this view
         *
         * @method render
         * @input {Object} parentDom The parent DOM where this view should be drawn
         */

        this.render = function(parentDom){
            var $this, datepickers;

            $this = this;
            parentDom.$.prepend($this.dom);
            this.dom.css("margin-left", config.labelWidth);

            this.fullScreenView = new FullScreenView(env);

            datepickers = $(templateManager.timepickersPopup);
            filtersPopup = $(templateManager.filtersPopup);
            thresholdsPopup = $(templateManager.thresholdsPopup);
            extraDataPopup = $(templateManager.extraDataPopup);
            dnsResponseDom = $(templateManager.dnsResponse);
            hostBindResponseDom = $(templateManager.hostBindResponse);
            tracerouteDom = $(templateManager.tracerouteRensponse);
            slidingMenu = $(templateManager.slidingMenu);

            autoUpdateButton = this.dom.find(".keep-updated");
            fullScreenButton = this.dom.find(".full-screen");

            this.dialogPopUp = this.dom.find(".dnsmon-popup");

            this.legend = this.dom.find(".legend");
            this.aggregationLevelLegend = this.dom.find(".legend-agr-level");

            this.updatePeriodically = {
                "dom": autoUpdateButton,
                "icon": autoUpdateButton.find("img")
            };

            this.fullScreenButton = {
                "dom": fullScreenButton,
                "icon": fullScreenButton.find("img")
            };

            this.aggregationLevelLegend.html(lang.aggregationLevelLabel + env.aggregationLabel);

            this.viewSelect = this.dom.find(".legend-controller-select");



            this.thresholdsPopup = {
                "dom": thresholdsPopup,
                "slider": thresholdsPopup.find(".thresholds-slider"),
                "legendPercentages": thresholdsPopup.find(".pls-percentage"),
                "legendUnit": thresholdsPopup.find(".pls-unit"),
                "legendColors": thresholdsPopup.find(".pls-color"),
                "description": thresholdsPopup.find(".popup-pls-text"),
                "messageApply": thresholdsPopup.find(".popup-pls-apply")
            };

            this.extraDataPopup = {
                "dom": extraDataPopup,
                "rawUrl": extraDataPopup.find(".popup-raw-data"),
                "overviewRawUrl": extraDataPopup.find(".popup-overview-raw-data"),
                "dnsResponse": extraDataPopup.find(".popup-dns-response"),
                "hostBindResponse": extraDataPopup.find(".popup-hostnamebind-response"),
                "traceroutePlace":extraDataPopup.find(".popup-traceroute"),

                "dnsResponseDom": dnsResponseDom,
                "hostBindResponseDom": hostBindResponseDom,
                "tracerouteDom": tracerouteDom
            };

            this.filtersPopup = {
                "dom": filtersPopup,
                "excludeErrorsCheck": filtersPopup.find(".exclude-errors"),
                "filter3Protocol": filtersPopup.find(".dnsmon-filter-3protocol"),
                "filter4Protocol": filtersPopup.find(".dnsmon-filter-4protocol")
            };

            this.datepickers = {
                "dom": datepickers
            };

            legendColors = $this.legend.find(".pls-color");
            legendUnit = $this.legend.find(".pls-unit");
            legendPercentages = $this.legend.find(".pls-percentage");

            legendColors.last().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[0]));
            legendColors.first().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[1] + config.colorSeparationOffset)); // Greater than

            this.thresholdsPopup.legendPercentages.last().val(env.mainView.colorDomainBreakPoints[0]);
            this.thresholdsPopup.legendPercentages.first().val(env.mainView.colorDomainBreakPoints[1]);

            this.thresholdsPopup.legendColors.last().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[0]));
            this.thresholdsPopup.legendColors.first().css("background-color", env.mainView.color(env.mainView.colorDomainBreakPoints[1] + config.colorSeparationOffset)); // Greater than


            this.dialogPopUp.dialog({
                resizable: false,
                modal: true,
                hide: 200,
                autoOpen: false,
                show: 100,
                open: function(){
                    $('.ui-dialog').addClass('default-text');
                },
                close: function(){
                    $('.ui-dialog').removeClass('default-text');
                }
            });

            this.initButtonEventHandlers();
        };


        /**
         * This method creates sliding menus
         *
         * @method bindSlidingMenu
         * @input {Object} callerButton The DOM element where to attach the sliding menu
         * @input {Object} menuItemsHtml The DOM to draw inside the sliding menu
         * @input {Number} height The height of the menu
         * @input {String} cssClass The class to be applied to the sliding menu
         * @input {Function} callback The callback to be called on click
         */

        this.bindSlidingMenu = function(callerButton, menuItemsHtml, height, cssClass, callback){
            var timerHide;

            if (insideSubMenu == null){
                env.mainDom.$.append(slidingMenu); // Append the sub menu dom
                slidingMenuOpened = false;
                insideSubMenu = false;

                slidingMenu
                    .on("mouseenter", function(){
                        insideSubMenu = true;
                    })
                    .on("mouseleave", function(evt){
                        insideSubMenu = false;
                        if ($(evt.target).attr('class') == slidingMenu.attr('class')){
                            hideSubMenu();
                        }
                    });
            }

            function hideSubMenu(){
                if (insideSubMenu == false){
                    slidingMenu
                        .removeClass(cssClass)
                        .off("click")
                        .hide()
                        .css({
                            height: "0"
                        });
                    slidingMenuOpened = false;
                    env.mainDom.$.tooltip("enable");
                }
            }

            callerButton
                .on("mouseenter",
                function(){
                    if (slidingMenuOpened == false){
                        clearTimeout(timerHide);
                        slidingMenuOpened = true;
                        slidingMenu.html(menuItemsHtml);

                        slidingMenu
                            .on("click", callback)
                            .addClass(cssClass)
                            .css({
                                left: callerButton.position().left,
                                top: callerButton.position().top + 20
                            })
                            .show()
                            .animate({
                                height: height
                            }, 300);

                        env.mainDom.$.tooltip("disable");
                    }
                })
                .on("mouseleave", function(){
                    clearTimeout(timerHide);
                    timerHide = setTimeout(hideSubMenu, 1000);
                });


        };


        /**
         * This method populates the view selectbox with all the options
         *
         * @method loadPossibleView
         */

        this.loadPossibleView = function(){
            var queryType;
            queryType = env.params.type;

            this.removeAllViews();

            switch(queryType){
                case "probes":
                    this.addPossibleView(lang.packetLossLabel, "pls");
                    this.addPossibleView(lang.responseTimeLabel, "rtt");
                    this.addPossibleView(lang.relativeResponseTimeLabel, "relative-rtt");
                    break;

                case "servers":
                    this.addPossibleView(lang.packetLossLabel, "pls");
                    this.addPossibleView(lang.responseTimeLabel, "rtt");
                    this.addPossibleView(lang.relativeResponseTimeLabel, "relative-rtt");
                    break;

                case "instances":
                    this.addPossibleView(lang.numberProbesLabel, "prb");
                    this.addPossibleView(lang.responseTimeLabel, "rtt");
                    this.addPossibleView(lang.relativeResponseTimeLabel, "relative-rtt");
                    break;
            }
        };


        /**
         * This method manages the auto-update function. It is an indirection for keepUpdated in MainView but it manages
         * the menu and the feedback for the user
         *
         * @method keepUpdatedActive
         * @input {Boolean} active If true the auto-update function will be activated
         */

        this.keepUpdatedActive = function(active){
            if(env.isOngoing){ // Is the measurement ongoing?
                if (!active){
                    env.mainView.showMessage(lang.keepUpdatedNotActive);
                    this.updatePeriodically.icon.attr("src", env.widgetUrl + 'view/img/keep_updated_icon.png');
                }else{
                    env.mainView.showMessage(lang.keepUpdatedActive);
                    this.updatePeriodically.icon.attr("src", env.widgetUrl + 'view/img/keep_updated_icon_move2.png');
                }

                env.isUpdatedPeriodicallyActive = active;
                env.mainView.timeController.keepUpdated(active);
            }
        };


        /**
         * This method manages all the auto-start functions
         *
         * @method _initAutoStartFunctions
         * @private
         */

        this._initAutoStartFunctions = function(){
            var $this;

            $this = this;

            env.mainView.on("load", function(){

                if (env.isUpdatedPeriodicallyActive){
                    $this.keepUpdatedActive(true); // Start the auto-update function
                }

                if (env.fullScreenActive){
                    $this.fullScreenView.fullScreenMode(true); // Start the full-screen
                }

            });
        };


        /**
         * This method creates all the listeners for the controllers
         *
         * @method initButtonEventHandlers
         */

        this.initButtonEventHandlers = function(){
            var timeController, manualZoomFactor, $this;

            timeController = env.mainView.timeController;
            manualZoomFactor = config.manualZoomFactor;
            $this = this;

            this._initAutoStartFunctions();

            this.updatePeriodicallyButton = this.updatePeriodically.dom
                .attr("title", lang.keepUpdatedTitle)
                .css("opacity", disabledOpacity)
                .on("click", function(){
                    env.isUpdatedPeriodicallyActive = !env.isUpdatedPeriodicallyActive;
                    $this.keepUpdatedActive(env.isUpdatedPeriodicallyActive);
                });


            this.zoomInButton = this.dom
                .find(".zoom-in")
                .attr("title", lang.zoomInTitle)
                .on("click", function(){
                    if (env.isZoomableIn){
                        timeController.zoomIn.call(timeController, manualZoomFactor);
                    }
                });

            this.zoomOutButton = this.dom
                .find(".zoom-out")
                .attr("title", lang.zoomOutTitle)
                .on("click", function(){
                    if (env.isZoomableOut){
                        timeController.zoomOut.call(timeController, manualZoomFactor);
                    }
                });

            this.leftButton = this.dom
                .find(".left")
                .attr("title", lang.shiftLeftTitle)
                .on("click", function(){
                    if (env.isTranslableLeft){
                        timeController.shiftLeft.call(timeController);
                    }
                });

            this.rightButton = this.dom
                .find(".right")
                .attr("title", lang.shiftRightTitle)
                .on("click", function(){
                    if (env.isTranslableRight){
                        timeController.shiftRight.call(timeController);
                    }
                });

            this.fullScreenButton.dom
                .attr("title", lang.fullScreenTitle)
                .on("click", function(){
                    env.fullScreenActive = !env.fullScreenActive; // Toggle full screen
                    $this.setFullScreen(env.fullScreenActive);
                });

            this.forwardButton = this.dom
                .find(".forward")
                .attr("title", lang.forwardTitle)
                .on("click", function(){
                    timeController.getNewData.call(timeController, null);
                });

            this.bindSlidingMenu(this.forwardButton, $(templateManager.getLastData), 90, 'get-last-data-sliding-panel', function(evt){
                var value;

                value = paramsManager.convertRemoteToLocalTimeWindow($(evt.target).text());

                timeController.getNewData.call(timeController, value);
            });


            this.datepickerButton = this.dom
                .find(".timepicker")
                .attr("title", lang.changeTimeWindowTitle)
                .on("click", function(){

                    $this.dialogPopUp.html($this.datepickers.dom);
                    $this.dialogPopUp.dialog("open");

                    $this.datepickers.start = $this.dialogPopUp.find(".timepicker-start");
                    $this.datepickers.stop = $this.dialogPopUp.find(".timepicker-stop");

                    $this.datepickers.start.datetimepicker({
                        minDate: utils.localDateToUTCDate(env.measurementStartTime),
                        maxDate: utils.localDateToUTCDate(env.measurementEndTime),
                        dateFormat: "yy-mm-dd",
                        beforeShow: function(){
                            $('#ui-datepicker-div').addClass('default-text');
                        },
                        onClose: function(){
                            $('#ui-datepicker-div').removeClass('default-text');
                        }
                    });

                    $this.datepickers.stop.datetimepicker({
                        minDate: utils.localDateToUTCDate(env.measurementStartTime),
                        maxDate: utils.localDateToUTCDate(env.measurementEndTime),
                        dateFormat: "yy-mm-dd",
                        beforeShow: function(){
                            $('#ui-datepicker-div').addClass('default-text');
                        },
                        onClose: function(){
                            $('#ui-datepicker-div').removeClass('default-text');
                        }
                    });

                    $this.datepickers.start.datepicker("setDate", utils.localDateToUTCDate(env.params.startDate));
                    $this.datepickers.stop.datepicker("setDate", utils.localDateToUTCDate(env.params.endDate));


                    $this.dialogPopUp.dialog({
                        title: lang.changeTimeWindowTitle,
                        width: 380,
                        height: 140,
                        buttons: {
                            "Cancel": function() {
                                $(this).dialog("close");
                            },

                            "Apply": function() {
                                env.params.startDate = utils.UTCDateToLocalDate($this.datepickers.start.datetimepicker('getDate'));
                                env.params.endDate = utils.UTCDateToLocalDate($this.datepickers.stop.datetimepicker('getDate'));
                                env.mainView.updateXDomain(true);
                                $(this).dialog("close");
                            }
                        },
                        beforeClose: function() {
                            $this.datepickers.start.datepicker("destroy");
                            $this.datepickers.stop.datepicker("destroy");
                        }
                    });

                });

            this.thresholdsButton = this.dom
                .find(".thresholds,.legend-pls") // Both button and legend are clickable STAT-511
                .attr("title", lang.changeColorsRangeTitle)
                .on("click", function(){
                    var thresholdsRanges;

                    $this.dialogPopUp.dialog("open");

                    thresholdsRanges = $this._getThresholdsRanges();
                    $this.dialogPopUp.html($this.thresholdsPopup.dom);

                    $this.dialogPopUp.dialog({
                        title: lang.changeColorsRangeTitle,
                        width: 460,
                        height: 220,
                        buttons: {

                            "Default": function(){
                                var newColorScale, showFilter;

                                showFilter = env.showFilter;

                                newColorScale = utils.computeColorScale(config.normalColorScales[showFilter]);
                                env.mainView.updateOnlyColors(newColorScale.valueRange);
                                $this.updateLegend(newColorScale.valueRange[2], newColorScale.valueRange[3]);
                                env.history.update();
                                $(this).dialog("close");
                            },

                            "Close": function() {
                                $(this).dialog("close");
                            }
                        }
                    });

                    $this.thresholdsPopup.description.html(lang.thresholdsDescritions[env.showFilter]);

                    $this.thresholdsPopup.slider.show();
                    $this.thresholdsPopup.messageApply.hide();

                    $this.thresholdsPopup
                        .slider
                        .slider({
                            range: true,
                            min: thresholdsRanges[0],
                            max: thresholdsRanges[1],
                            values: env.mainView.colorDomainBreakPoints,
                            stop: function(){
                                env.history.update();
                            },
                            slide: function(event, ui) {
                                var newValuesRange;

                                $this.updateLegend(ui.values[0], ui.values[1]);

                                newValuesRange = [
                                    thresholdsRanges[0],
                                    ui.values[0],
                                    ui.values[0],
                                    ui.values[1],
                                    thresholdsRanges[1]
                                ];
                                env.mainView.updateOnlyColors(newValuesRange);
                            }
                        });

                    $this.thresholdsPopup.legendPercentages
                        .off('keydown')
                        .off('change')
                        .on('keydown', function(evt){
                            var unicode;

                            evt.stopPropagation();
                            unicode = (evt.which) ? evt.which : evt.keyCode;
                            if (!(unicode > 31 && (unicode < 48 || unicode > 57) && (unicode < 96 || unicode > 105))) {
                                $this.thresholdsPopup.slider.hide();
                                $this.thresholdsPopup.messageApply.show();
                            }
                        })
                        .on('change keyup', function(evt){
                            var max, min, valueMax, valueMin, values, slider, parent, unicode;
                            evt.stopPropagation();

                            unicode = (evt.which) ? evt.which : evt.keyCode;

                            if (!unicode || unicode == 13){

                                $this.thresholdsPopup.messageApply.hide();
                                slider = $this.thresholdsPopup.slider;

                                slider.show();

                                max = slider.slider('option', 'max');
                                min = slider.slider('option', 'min');

                                parent = $this.thresholdsPopup.dom;

                                values = [parseFloat(parent.find('.min-val').val()), parseFloat(parent.find('.max-val').val())];

                                valueMin = (utils.isNumber(values[0]) && values[0] < max && values[0] > min) ? parseFloat(values[0]) : parseFloat(min);
                                valueMax = (utils.isNumber(values[1]) && values[1] < max && values[1] > min) ? parseFloat(values[1]) : parseFloat(max);


                                if (valueMax < valueMin){ // Don't invert the boundaries
                                    if (valueMax == parseFloat($(this).val())){ // Give to the user a feedback related to what is changed in the last interaction
                                        valueMax = valueMin;
                                    }else{
                                        valueMin = valueMax;
                                    }

                                }

                                slider.slider("values", 1, valueMin);
                                $this.thresholdsPopup.legendPercentages.last().val(valueMin);

                                slider.slider("values", 0, valueMax);
                                $this.thresholdsPopup.legendPercentages.first().val(valueMax);

                                $this.updateLegend(valueMin, valueMax);
                                env.mainView.updateOnlyColors([min, valueMin, valueMin, valueMax, max]);
                            }
                        });
                });

            this.allRowsButton = this.dom
                .find(".allrows")
                .attr("title", lang.allRowsTitle)
                .css("opacity", disabledOpacity)
                .on("click", function(){
                    if (env.params.selectedRows.length != 0){

                        env.params.selectedRows = [];
                        env.params.filterProbes = false;
                        env.mainView.redraw();
                    }
                });

            this.filterSelection = this.dom
                .find(".filters")
                .attr("title", lang.filterSelectionTitle)
                .on("click", function(){

                    $this.dialogPopUp.dialog("open");
                    $this.dialogPopUp.html($this.filtersPopup.dom);

                    $this.dialogPopUp.dialog({
                        title: lang.filtersPopupTitle,
                        width: 300,
                        height: 140,
                        buttons: {
                            "Close": function() {
                                $(this).dialog("close");
                            }
                        }
                    });

                    $this.filtersPopup
                        .excludeErrorsCheck
                        .off("click")
                        .attr('checked', (env.session.getValue('exclude-errors') == 'true'))
                        .on("click", function(){
                            env.session.saveValue('exclude-errors', $(this).is(":checked"));
                            env.mainView.redraw();
                        });


                    $this.filtersPopup
                      .filter3Protocol
                      .off("change")
                      .attr("disabled", (env.params.type == "probes"))
                      .val((env.params.ipVersion == null) ? "both" : env.params.ipVersion)
                      .on("change", function(){
                        var actualVal;

                        actualVal = $(this).val();
                        actualVal = (actualVal == "both") ? null : actualVal;
                        env.params.selectedRows = [];
                        env.params.ipVersion = actualVal;
                        env.mainView.redraw();
                      });

                    $this.filtersPopup
                      .filter4Protocol
                      .off("change")
                      .val((env.params.isTcp) ? "tcp" : "udp")
                      .on("change", function(){
                        env.params.isTcp = ($(this).val() == "tcp");
                        env.mainView.redraw();
                      });

                });

            this.viewSelect
                .on("change", function(){
                    env.showFilter = $(this).val();
                    env.mainView.redraw();
                });
        };


        /**
         * This method returns the ranges for the colors thresholds
         *
         * @method _getThresholdsRanges
         * @private
         * @return {Array} An array composed of two integers
         */

        this._getThresholdsRanges = function(){
            var showFilter;

            showFilter = env.showFilter;
            switch(showFilter){
                case "pls":
                    return [0, 100];
                    break;

                case "rtt":
                    return [0, 5000];
                    break;

                case "relative-rtt":
                    return [0, 1000];
                    break;

                case "prb":
                    return [0, 5000];
                    break;
            }
        };


        /**
         * This method manages the full screen mode. It is an indirection for fullScreenMode in FullScreenView
         * but it manages the menu and the feedback for the user
         *
         * @method setFullScreen
         * @return {Boolean} fullScreen If true the full screen will be activated
         */

        this.setFullScreen = function(fullScreen){
            var icon;

            icon = (fullScreen) ? 'view/img/dnsmon_smallscreen_icon.png' : 'view/img/dnsmon_fullscreen_icon.png';

            this.fullScreenButton.icon.attr("src", env.widgetUrl + icon);
            this.fullScreenView.fullScreenMode(fullScreen);
        };


        /**
         * This method updates the status of all the items in the menu (e.g. if a button is clickable or not)
         *
         * @method update
         */

        this.update = function(){
            this.allRowsButton.css("opacity", (env.params.selectedRows.length == 0) ? disabledOpacity : normalOpacity);
            this.rightButton.css("opacity", (env.isTranslableRight == false) ? disabledOpacity : normalOpacity);
            this.leftButton.css("opacity", (env.isTranslableLeft == false) ? disabledOpacity : normalOpacity);
            this.zoomInButton.css("opacity", (env.isZoomableIn == false) ? disabledOpacity : normalOpacity);
            this.zoomOutButton.css("opacity", (env.isZoomableOut == false) ? disabledOpacity : normalOpacity);

            this.updatePeriodicallyButton.css("opacity", (env.isOngoing == false) ? disabledOpacity : normalOpacity);


            this.updateAggregationLevelLegend(lang.aggregationLevelLabel + ': ' + env.aggregationLabel);

            this.updateLegend(env.mainView.colorDomainBreakPoints[0], env.mainView.colorDomainBreakPoints[1]);

            this.loadPossibleView();
        };


        /**
         * This method updates the color thresholds with the new values
         *
         * @method updateLegend
         * @input {Number} firstValue An integer for the first threshold
         * @input {Number} secondValue An integer for the second threshold
         */

        this.updateLegend = function(firstValue, secondValue){
            var firstUnit, secondUnit, showFilter, realFirstValue, realSecondValue, realFirstUnit, realSecondUnit;

            showFilter = env.showFilter;

            realFirstValue = firstValue;
            realSecondValue = secondValue;

            switch(showFilter){
                case "pls":
                    realFirstUnit = "%";
                    realSecondUnit = "%";
                    firstUnit = realFirstUnit;
                    secondUnit = realSecondUnit;
                    break;

                case "rtt":
                    if (firstValue >= 1000){
                        firstValue = (firstValue/1000).toFixed(1);
                        realFirstUnit = "ms";
                        firstUnit = "s";
                    }else{
                        realFirstUnit = "ms";
                        firstUnit = "ms";
                    }

                    if (secondValue >= 1000){
                        secondValue = (secondValue/1000).toFixed(1);
                        realSecondUnit = "ms";
                        secondUnit = "s";
                    }else{
                        realSecondUnit = "ms";
                        secondUnit = "ms";
                    }

                    break;

                case "relative-rtt":
                    realFirstUnit = "%";
                    realSecondUnit = "%";
                    firstUnit = realFirstUnit;
                    secondUnit = realSecondUnit;
                    break;

                case "prb":
                    firstUnit = "#p";
                    secondUnit = "#p";
                    break;
            }

            legendPercentages.last().html(firstValue);
            legendPercentages.first().html(secondValue);

            legendUnit.last().html(firstUnit);
            legendUnit.first().html(secondUnit);

            this.thresholdsPopup.legendPercentages.last().val(realFirstValue);
            this.thresholdsPopup.legendPercentages.first().val(realSecondValue);

            this.thresholdsPopup.legendUnit.last().html(realFirstUnit);
            this.thresholdsPopup.legendUnit.first().html(realSecondUnit);
        };


        /**
         * This method updates the data resolution legend
         *
         * @method updateAggregationLevelLegend
         * @input {String} newLabel The new legend
         */

        this.updateAggregationLevelLegend = function(newLabel){
            var domElement;
            domElement = this.aggregationLevelLegend;

            if (domElement.text() != newLabel){
                domElement
                    .html(newLabel)
                    .attr("title", lang.aggregationLevelTitle)
                    .toggleClass("updated");

                setTimeout(function(){
                    domElement.toggleClass("updated");
                }, config.aggregationLegendUpdatedDuration);
            }

        };


        /**
         * This method appends an option for the selectobox fo the views
         *
         * @method addPossibleView
         * @input {String} label The name of the view
         * @input {String} value The value/key of the view
         */

        this.addPossibleView = function(label, value){
            var checked, showFilter;

            showFilter = env.showFilter;

            checked = (value == showFilter) ? 'selected="selected"' : '' ;
            this.viewSelect.append('<option value="' + value + '" ' + checked + '>' + label + '</option>');
        };


        /**
         * This method removes all the options of the selectobox fo the views
         *
         * @method removeAllViews
         */

        this.removeAllViews = function(){
            this.viewSelect.html("");
        };


        this._showDnsResponse = function(cell, dnsResponsePlace){
            var htmlDnsResponse, dataItem;

            this.dialogPopUp.dialog({height: 320, minWidth: 0, minHeight: 0, maxHeight: 0});
            this.dialogPopUp.dialog("option", "resizable", false);
            if (!lazyLoadTab1) {
                env.connector.getNativeDnsResult(cell, function (data) { // Show the DNS response

                    lazyLoadTab1 = true;
                    for (var n = 0, length = data.length; n < length; n++) {
                        dataItem = data[n];
                        htmlDnsResponse = this.extraDataPopup.dnsResponseDom.clone();

                        htmlDnsResponse.find(".dns-response-prbid").html(dataItem.probeId);
                        htmlDnsResponse.find(".dns-response-rt").html(dataItem.responseTime);
                        htmlDnsResponse.find(".dns-response-date").html(utils.dateToString(dataItem.date));

                        if (dataItem.nsId) {
                            htmlDnsResponse.find(".dns-response-nsid").html(dataItem.nsId);
                        } else {
                            htmlDnsResponse.find(".dns-response-nsid-rd").hide();
                        }

                        if (dataItem.response && dataItem.response != '') {
                            htmlDnsResponse.find(".dns-response-plaintext").html(dataItem.response);
                        }

                        if (dataItem.error) {
                            htmlDnsResponse.find(".dns-response-plaintext").addClass("dns-response-error").html('[' + dataItem.error.type + '] ' + dataItem.error.message);
                        }

                        dnsResponsePlace.append(htmlDnsResponse);
                    }

                }, this);
            }
        };


        this._showTraceroutes = function(cell, traceroutePlace){
            var dataItem, textareaWidth, tracerouteArea;

            this.dialogPopUp.dialog({height: 512, minWidth: 490, minHeight: 512, maxHeight: 512});
            this.dialogPopUp.dialog("option", "resizable", true);
            if (!lazyLoadTab2) {
                env.connector.getClosestTraceroutes(cell, function (data) { // Show the closest Traceroutes
                    lazyLoadTab2 = true;
                    if (data.length > 0) {
                        tracerouteDom = this.extraDataPopup.tracerouteDom.clone();
                        traceroutePlace.append(tracerouteDom);

                        if (data.length >= 2) {
//                            this.dialogPopUp.dialog("option", "resizable", true);
                            this.dialogPopUp.dialog({
                                resize: function (event, ui) {
                                    if (ui.size.width > textareaWidth * 2 + 74) {
                                        $(this).addClass("resized-dialog-traceroute");
                                    } else {
                                        $(this).removeClass("resized-dialog-traceroute");
                                    }
                                }
                            });

                        } else {
                            this.dialogPopUp.dialog("option", "resizable", false);
                        }

                        for (var n = 0, length = data.length; n < length; n++) {

                            dataItem = data[n];

                            tracerouteArea = $('<div class="textarea"></div>').tooltip(
                                {
                                    tooltipClass: 'custom-jquery-ui-tooltip',
                                    hide: {
                                        effect: "fade",
                                        duration: config.tooltipFade
                                    }
                                });

                            tracerouteArea.html(dataItem);
                            tracerouteDom.append(tracerouteArea);
                            textareaWidth = tracerouteArea.outerWidth();
                        }

                    }
                }, this);
            }
        };

        this._showHostonameBindResponse = function(cell, hostBindResponsePlace){
            var htmlHostnameResponse, dataItem;

            this.dialogPopUp.dialog({height: 380, minWidth: 0, minHeight: 0, maxHeight: 0});
            this.dialogPopUp.dialog("option", "resizable", false);
            if (!lazyLoadTab3) {
                env.connector.getClosestHostnameBind(cell, function (data) { // Show the closest Traceroutes
                    lazyLoadTab3 = true;
                    if (data.length > 0) {

                        for (var n = 0, length = data.length; n < length; n++) {
                            dataItem = data[n];

                            htmlHostnameResponse = this.extraDataPopup.hostBindResponseDom.clone();
                            htmlHostnameResponse.find(".hostbind-response-prbid").html(dataItem.probeId);
                            htmlHostnameResponse.find(".hostbind-response-msmId").html(dataItem.msmId);
                            htmlHostnameResponse.find(".hostbind-response-rt").html(dataItem.responseTime);
                            htmlHostnameResponse.find(".hostbind-response-date").html(utils.dateToString(dataItem.date));

                            if (dataItem.response && dataItem.response != '') {
                                htmlHostnameResponse.find(".hostbind-response-plaintext").html(dataItem.response);
                            } else {
                                htmlHostnameResponse.find(".hostbind-response-plaintext").html(env.lang.hostBindResponseNoAnswer);
                            }

                            hostBindResponsePlace.append(htmlHostnameResponse);
                        }

                    }
                }, this);
            }
        };

        /**
         * This method renders a dialog box with all the information related to a cell
         *
         * @method showExtraInfoDialog
         * @input {Object} cell A cell object
         */

        this.showExtraInfoDialog = function(cell){
            var overviewUrls, sampleUrls, parentOverview, parentSample, linkText, linkUrl, linkCurrent, urlItem,
                dnsResponsePlace, traceroutePlace, dialogHeight, n, length, hostBindResponsePlace, $this;

            $this = this;

            lazyLoadTab1 = false;
            lazyLoadTab2 = false;
            lazyLoadTab3 = false;

            overviewUrls = env.connector.getDataUrls(cell);
            sampleUrls = env.connector.getCellDataUrls(cell);

            dialogHeight = 210;

            this.dialogPopUp.dialog({
                title: lang.extraInfoDialogTitle,
                width: 500,
                height: dialogHeight,
                close: function(){
                    var $this;

                    $this = $(this);
                    $this.removeClass("resized-dialog-traceroute");
                    $this.dialog({height: 0, minWidth: 0, minHeight: 0, maxHeight: Infinity});
                    $this.dialog("option", "resizable", false);
                },
                buttons: {
                    "Close": function() {
                        $(this).dialog("close");
                    }
                }
            });

            this.dialogPopUp.dialog("open");
            this.dialogPopUp.html(this.extraDataPopup.dom);

            parentOverview = this.extraDataPopup.overviewRawUrl;
            parentSample = this.extraDataPopup.rawUrl;

            parentOverview.html('');
            parentSample.html('');

            for (n=0,length=sampleUrls.length; n<length; n++){
                urlItem = sampleUrls[n];
                linkUrl = urlItem.url;
                linkText = urlItem.label;
                linkCurrent = urlItem.current;

                if (env.retrievedAggregationLevel != 0 || linkCurrent){
                    parentSample.append('<a target="_blank" href="' + linkUrl + '" title="' + linkText + '">' + linkText + ((linkCurrent) ? ' (current)' : '') + '</a> ');
                }
            }

            for (n=0,length=overviewUrls.length; n<length; n++){
                urlItem = overviewUrls[n];
                linkUrl = urlItem.url;
                linkText = urlItem.label;
                linkCurrent = urlItem.current;
                if (env.retrievedAggregationLevel != 0 || linkCurrent){
                    parentOverview.append('<a target="_blank" href="' + linkUrl + '" title="' + linkText + '">' + linkText + ((linkCurrent) ? ' (current)' : '') + '</a> ');
                }
            }

            dnsResponsePlace = this.extraDataPopup.dnsResponse;
            dnsResponsePlace.html("").removeClass('dns-response-error');

            hostBindResponsePlace = this.extraDataPopup.hostBindResponse;
            hostBindResponsePlace.html("").removeClass('hostbind-response-error');

            traceroutePlace = this.extraDataPopup.traceroutePlace;
            traceroutePlace.html("");

            this.dialogPopUp.dialog("option", "resizable", false);

            if (env.retrievedAggregationLevel == 0) {
                this.dialogPopUp.find('.popup-tabs').show().tabs().find('a').on('click', function () {
                    var tab, tabId;

                    tab = $(this);
                    tabId = tab.attr('href');

                    switch (tabId) {

                        case '#tabs-1':
                            $this._showDnsResponse(cell, dnsResponsePlace);
                            break;

                        case '#tabs-2':
                            $this._showTraceroutes(cell, traceroutePlace);
                            break;

                        case '#tabs-3':
                            $this._showHostonameBindResponse(cell, hostBindResponsePlace);
                            break;
                    }
                });
                this._showDnsResponse(cell, dnsResponsePlace);
            } else {
                this.dialogPopUp.find('.popup-tabs').hide();
            }

        };


    };

    return ControlPanelView;
});