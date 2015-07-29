/**
 * Created by mcandela on 23/01/14.
 */


define([], function(){
  return {
    aggregationLevelLabel: "Data resolution",
//        packetLossRangesLabel: "Unanswered queries colours range:",
    packetLossLabel: "Unanswered queries",
    responseTimeLabel: "Response time",
    forwardTitle: "Get the latest results",
    relativeResponseTimeLabel: "Relative response time",
    viewSelectboxTitle: "Inspect the same situation from another point of view",
    numberProbesLabel: "Number of probes",
    startDateLabel: "Start date:",
    endDateLabel: "End date:",
    changeTimeWindowTitle: "Change time window",
    changeColorsRangeTitle: "Change colours range",
    shiftLeftTitle: "Shift the time window left",
    shiftRightTitle: "Shift the time window right",
    zoomInTitle: "Zoom in",
    zoomOutTitle: "Zoom out",
    closestTracerouteLabel: "Closest traceroutes before and after the selected cell (enlarge the dialog to compare):",
    allRowsTitle: "Display all rows",
    serverLevelLabel: "server",
    zoneLevelLabel: "zone",
    malformedDataset: "Sorry, malformed input data",
    serverSlowMessage: "Sorry, the server is responding slowly",
    connectionFailed: "Sorry, it is impossible to connect to the server",
    lastQueryFails: "Last query failed; the current visualisation is not up to date",
    waitingConnection: "Waiting for connection",
    filtersPopupTitle: "Filters",
    excludeErrorsFilterLabel: "Exclude errors (exclude rcodes != 0)",

    pressToApply: "Press Enter to apply",
    extraInfoDialogTitle: "Result details",

    keepUpdatedTitle: "Continually update results",
    keepUpdatedNotActive: "Auto refresh disabled",
    keepUpdatedActive: "Auto refresh enabled",
    extraInfoDialogTextSample: "Data for the selected cell",
    extraInfoDialogTextOverview: "Measurement overview on RIPE Atlas",
    minimumTimeSelectionReached: "Sorry, minimum time window reached",
    fromTimeRange: "From:",
    toTimeRange: "To:",
    lastUpdateAt: "Last update:",
    aggregationLevelTitle: "Data resolution describes the amount of time represented by one cell",
    dnsResponsePrbId: "Probe ID",
    dnsResponseRt: "Response time",
    dnsResponseNsId: "NSID",
    dnsResponseDate: "Date",
    notYourConfig: "This permalink is temporarily overriding your personal configurations",
    fullScreenTitle: "Full screen",


    minimumSelectionImposed: "Sorry, the selection was too small    ",
    tooZoomedMessage: "Sorry, we don't have more details. Try to click on a row's name",
    clickToRemoveRow: "Click on a row's name to exclude it from the displayed results",
    bottomInfoSection: "Use your mouse wheel or click and drag a selection to zoom, press the left/right arrow keys to shift the time window, press the shift key to remove rows from the displayed results",

    noDataForRow: "We don't have data for this server in the selected time period",

    hostBindResponsePrbId: "Probe ID",
    hostBindResponseRt: "Response time",
    hostBindResponseMsmId: "Measurement ID",
    hostBindResponseDate: "Date",
    hostBindResponseNoAnswer: "The response has no answer",

    tab1Title: 'DNS response',
    tab2Title: 'Traceroute',
    tab3Title: 'hostname.bind',

    thresholdsDescritions: {
      pls: "Change the unanswered queries colours range: these thresholds are used to colours the cells based on the percentage of packets lost.",
      rtt: "Change the response time colours range: these thresholds are used to colours the cells based on the response time.",
      "relative-rtt": "Change the relative response time colours range: these thresholds are used to colours the cells based on the increase in the response time related to the minimum available for the row."
    },


    /*not revised*/
    filterSelectionTitle: "Filter the represented data:",

    protocol3SelectionFilterLabel: "Layer 3 protocol",
    protocol4SelectionFilterLabel: "Layer 4 protocol"
  }
});