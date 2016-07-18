
define([], function(){

    /**
     * Configuration file
     */

    return {
        widgetPrefix: "lm",
        dataAPIs: {
//            results: "https://atlas.ripe.net/api/v2/measurements/0000/results.jsonp",
            results: "http://localhost/unified_api.php?id=0000",
            metadata: "https://atlas.ripe.net/api/v2/measurements/0000/routequake/meta.jsonp",
            dataApiAsAnnotation: "https://stat.ripe.net/data/network-info/data.json",
            dataApiReverseDns: "https://stat.ripe.net/data/reverse-dns-ip/data.json",
            dataApiGeolocation: "https://stat.ripe.net/data/geoloc/data.json",
            dataApiAsnNeighbours: "https://stat.ripe.net/data/asn-neighbours/data.json",
            peeringDb: {
                lans: "https://www.peeringdb.com/api/ixlan",
                ixps: "https://www.peeringdb.com/api/ix",
                prefixes: "https://www.peeringdb.com/api/ixpfx"
            }
        },
        defaultViewName: "as",
        defaultAggregationIPv4: false, //
        defaultAggregationIPv6: false, //
        streamingUrl: "https://atlas-stream.ripe.net:443",
        viewsEnabled: ["host", "as"],
        ixpHostCheck: false

    };
});
