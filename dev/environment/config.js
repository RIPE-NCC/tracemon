
define([], function(){

    /**
     * Configuration file
     */

    return {
        widgetPrefix: "lm",
        dataAPIs: {
            results: "https://atlas.ripe.net/api/v2/measurements/0000/routequake/results.jsonp",
            meta: "https://atlas.ripe.net/api/v2/measurements/0000/routequake/meta.jsonp"
        },
        streamingUrl: "https://atlas-stream.ripe.net:443",
        maxProbes: 8,
        autoMergeSameTargetMeasurement: false,
        autoMergeSamplesSameProbeDifferentMeasurement: true,
        autoMergeOnGrouping: true,
        singleChartHeight: 120,
        naturalResolution: "time",
        updateIfYoungerThanMilliseconds: 1000 * 60 * 15,
        timeOverviewMargins:  {top: 0, right: 26, bottom: 70, left: 2},
        brusherBucketLevelsMinutes: {
            "day": 43200 * 0.5, //0.5 month
            "week": 43200 * 6, //5 months
            "month": (43200 * 12 * 3) //1 year
        },
        timeOverviewHeight: 97,
        hideTimeOverviewWhenLessThanSeconds: 0,
        drawDotsOnComparisonCharts: false,
        hoverPopUpDelay: 1000, // ms
        hoverPopUpMargin: 5, // px
        probeDescriptionDomWidth: 170,
        aSampleEveryPixels: 6,
        maxNumberOfSamplesPerRow: 80, //60
        bucketsTollerance: 0.2,
        minimumPixelSelectable: 5,
        syncWithRealTimeData: true,
        predefinedTimeWindows: {"1h": 60*60, "2d": 60*60*24*2, "2w": 60*60*24*14, "1m": 60*60*24*30},
        defaiultTimeWindow: "1h",
        minimumPeriod: 60*60,
        maximumPeriod: 60*60*24*30*2,
        zoomFactor: 10,
        minimumProbesPerGroup: 2,
        minimumGroupNumber: 3,
        maximumNumberOfGroups: 6,
        numberOfSpareProbes: 8,
        autoStartGrouping: true,
        addSamplesWithEmulation: false,
        sendBacklogStreaming: true,
        antiFloodRedrawCharts: 3000,
        notShownPacketLossThreshold: 0.1,
        messageOverlayDurationSeconds: 3,
        slowServerIntervalMilliseconds: 4000,

        domClasses:{
            chartDomClass: 'chart',
            bottomInfoNoticeClass: 'footer-info'
        }
    };
});
