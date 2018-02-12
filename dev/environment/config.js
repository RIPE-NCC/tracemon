
define([], function(){

    /**
     * Configuration file
     */

    return {
        widgetPrefix: "tm",
        defaultTrackingKey: "tracemon",
        dataAPIs: {
            results: "https://massimo.ripe.net/tracemon/unified_api.php?id=0000",
            metadata: "https://atlas.ripe.net/api/v2/measurements/0000/routequake/meta/",
            dataApiAsAnnotation: "https://massimo.ripe.net/tracemon/as_lookup.php",
            dataApiReverseDns: "https://stat.ripe.net/data/reverse-dns-ip/data.json",
            dataApiGeolocation: "https://openipmap.ripe.net/api/v1/locate/all/",
            dataApiAsnNeighbours: "https://stat.ripe.net/data/asn-neighbours/data.json",
            shortAsNamesApi: "https://massimo.ripe.net/tracemon/short_names.php",
            persistHostApi: "https://openipmap.ripe.net/api/v1/crowdsource/0000",
            storageLogRestApiUrl: "//massimo.ripe.net/tracemon/widget_log.php",
            storageErrorRestApiUrl: "//massimo.ripe.net/tracemon/widget_log.php",
            ripeDatabase: {
                whois: "https://massimo.ripe.net/tracemon/jsonp.php?callback=?&resource=http://rest.db.ripe.net/ripe/aut-num/AS0000.json",
                person: "https://massimo.ripe.net/tracemon/jsonp.php?callback=?&resource=http://rest.db.ripe.net/ripe/person/0000.json%3Funfiltered", //Keep it unfiltered
                role: "https://massimo.ripe.net/tracemon/jsonp.php?callback=?&resource=http://rest.db.ripe.net/ripe/role/0000.json%3Funfiltered" //Keep it unfiltered
            },
            abuseContactRestApi: "https://stat.ripe.net/data/abuse-contact-finder/data.json",
            peeringDb: {
                // lans: "http://localhost/peering_db.php?type=ixlan",
                ixps: "https://openipmap.ripe.net/api/v1/peeringdb/ixps",
                // prefixes: "http://localhost/peering_db.php?type=ixpfx"
            },
            anycastIndex: "https://openipmap.ripe.net/api/v1/anycast/all"
        },
        externalLinks: {
            bgplay: 'https://stat.ripe.net/widget/bgplay#w.resource=0000&w.starttime=1111&w.endtime=2222',
            peeringDb: 'https://www.peeringdb.com/ix/0000',
            whois: 'https://apps.db.ripe.net/search/query.html?searchtext=AS0000'
        },
        autoStart: true,
        defaultViewName: "host",
        defaultAggregationIPv4: false,
        defaultAggregationIPv6: false,
        streamingUrl: "https://atlas-stream.ripe.net:443",
        viewsEnabled: ["host", "as"],
        reproductionSpeed: 5, // Default speed of the reproduction between 1 and maxReproductionSpeed
        maxReproductionSpeed: 10, // Maximum speed of the reproduction
        reproductionSpeedUnit: 200, // milliseconds - Reduce or increase this value to speed up or slow down the reproduction speed keeping the scale intact
        ixpHostCheck: true,
        maxNumberHops: 8,
        realTimeUpdate: true,
        eventGroupingAntiFlood: 800,
        queryGroupingAntiFlood: 300,
        maxBundledQueries: 10,
        templatesLocation: "dev/view/html/",
        defaultLabelLevel: "auto",
        ajaxTimeout: 120000,
        reloadSourcesDiff: 3, // reload the dataset id the sources set changes of at least N probes
        filterRepeatedTraceroutes: true, // Filter traceroutes reporting the same results consecutively
        defaultLoadedPeriod: 10, // Multiple of measurement interval
        maximumLoadedPeriod: 120, // Multiple of measurement interval
        defaultNumberOfDisplayedSources: 8,
        maxAllowedSources: 20,
        minimumTracerouteValiditySeconds: 60 * 3,
        oneOffInterval: 60 * 10, // 10 minutes
        retryGeolocationAfter: (1000 * 60 * 3.5),

        startWithLastStatus: true,
        filterLateAnswers: true,
        premptiveGeolocation: true, // Try to get one if none is loaded at boot, even if not requested
        premptiveReverseDns: true,
        preloadGeolocations: false, // Requests the geolocations at boot with together with the results
        sendErrors: false,
        persistLocations: true,
        logAppTag: "tracemon",

        lateReportedResults: 200, // seconds of validity for a late reported result
        defaultTimeRangeGranularity: 60 * 5, // Seconds
        maxMessageTimeoutSeconds: 60,
        messageTimeout: 4,
        timeRangeSelectionOverflow: 2000, //ms

        transitionsTimes:{
            pathChange: 600,
            pathRemoval: 600,
            nodeRemoval: 1000,
            annotationRemoval: 2000,
            annotationDelay: 2000
        },

        graph: {
            showTargetNodeIfNotReached: true,
            margins: { top: 20, bottom: 20, left: 150, right: 150 },
            removeCycle: true,
            groupCycles: true,
            combineNullHosts: true,
            allowRotatedLabels: false,
            combineSameAsNullNode: false,
            labelOrientationPreference: ["r", "t", "l"], // "b" no bottom positioning
            pathInterpolation: "basis",
            drawSingleEdges: true,
            nodeRadius: 6,
            nodeSelectedRadius: 8,
            warningSignRadius: 3,

            normalOpacity: 1,
            verticalNodeDistance: 30,

            asColors: ["#ff0000", "#ffcc00", "#00ffaa", "#005299", "#f780ff", "#590000", "#594700", "#bfffea", "#bfe1ff",
                "#590053", "#99574d", "#66644d", "#005947", "#001433", "#b3008f", "#992900", "#8f9900", "#00ffee", "#001f73",
                "#ff0088", "#ffa280", "#003033", "#0022ff", "#804062", "#ffd0bf", "#ccff00", "#53a0a6", "#8091ff",
                "#99003d", "#ff6600", "#293300", "#00ccff", "#7c82a6", "#664d57", "#332b26", "#a1e673", "#00aaff", "#6c29a6",
                "#ff0044", "#593000", "#44ff00", "#003c59", "#e1bfff", "#330d17", "#ffa640", "#00590c", "#23698c", "#220033",
                "#ffbfd0", "#d9b56c", "#53a674", "#4d5e66", "#cc00ff", "#ff8091"] //Generated by the CMC(I:c) colour differencing algorithm to procedurally generate a set of visually-distinguishable colours within a certain tolerance.
        },

        errors: {
            "324": "No results to display for the selected time range",
            "400": "To retrieve data, a time range is required",
            "403": "The selected measurement is private",
            "404": "The measurement cannot be found",
            "405": "The probe cannot be found",
            "406": "The measurement added is not a traceroute",
            "408": "The requested data query timed out",
            "500t": "The startTimestamp cannot be after the stopTimestamp",
            "500n": "Both startTimestamp and stopTimestamp have to be specified or none of them",
            "501": "The resourse type cannot be geolocated",
            "502": "The resourse type cannot be persisted",
            "506": "The selected instant is out of the selected time range",
            "507": "To compute the final query params, at least one measurement must be loaded",
            "508": "The selected instant is out of the measurement lifespan",
            "603": "LatencyMON cannot be loaded: no RTT charts available",
            "694": "The time window has been changed because it was too wide",
            "695": "The RIPE Database doesn't contain any contact information for this resource",
            "696": "Location not valid",
            "697": "Maximum number of probes exceeded"
        }

    };
});
