<?php
header('Content-Type: application/json');
ini_set('memory_limit', '-1');
error_reporting(E_ERROR | E_WARNING | E_PARSE);

$msm = intval($_GET['id']);
$start = intval($_GET['start']);
$stop = intval($_GET['stop']);
$callback = $_GET['callback'];

$ases = [];
$geos = [];
$ases_reverse = [];
$link = mysql_connect('localhost', 'test', '6vc0ZOCsywvI39Gb');
mysql_select_db('as');

$url = 'https://atlas.ripe.net/api/v2/measurements/'.$msm.'/results?type=jsonp&start='.$start.'&stop='.$stop;
$response = file_get_contents($url);
$response = json_decode($response, true);


function enrich_as($asn){
    $asno = [];

    $retval = mysql_query("SELECT * FROM ases  WHERE asn = '$asn'");

    if($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
        $holder = $row['holder'];
        $announced = $row['announced'] == 1;
        $block = json_decode($row['block']);
    } else {
        $url = 'https://stat.ripe.net/data/as-overview/data.json?resource=AS'.$asn;
        $response = file_get_contents($url);
        $response = json_decode($response, true);

        if (isset($response['data'])){

            if (isset($response['data']['holder'])){
                $holder = $response['data']['holder'];
            }

            if (isset($response['data']['announced'])){
                $announced = $response['data']['announced'];
            }

            if (isset($response['data']['block'])){
                $block = json_encode($response['data']['block']);
            }

            mysql_query("INSERT INTO ases VALUES ($asn, '$holder', $announced, '$block')");
        }
    }


    $asno['holder'] = $holder;
    $asno['announced'] = $announced;
    $asno['block'] = $block;
    $asno['number'] = (int)$asn;

    return $asno;
}

function generate_as($ip){
     global $ases;
     global $ases_reverse;

     if (!isset($ases[$ip])){

         $retval = mysql_query("SELECT asn FROM hosts  WHERE hosts.ip = '$ip'");

         if($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
             $asn = $row['asn'];
         } else {

             $url = 'https://stat.ripe.net/data/network-info/data.json?resource='.$ip;
             $response = file_get_contents($url);
             $response = json_decode($response, true);

             if (isset($response['data']['asns'])){
                 $asn = $response['data']['asns'][0];

                 mysql_query("INSERT INTO hosts VALUES ('$ip', '$asn')");
             }

         }


         $ases[$ip] = $asn;

         if (isset($asn)){
             if (!isset($ases_reverse[$asn])){
                 $ases_reverse[$asn] = enrich_as($asn);
             }
         }
     }

     return $ases[$ip];
 }

 function get_geolocation($ip){
     global $geos;

     if (!isset($geos[$ip])){

         $retval = mysql_query("SELECT * FROM geoloc WHERE ip = '$ip'");

         if($row = mysql_fetch_array($retval, MYSQL_ASSOC)) {
             $geoloc['location'] = $row['location'];
             $geoloc['lat'] = $row['lat'];
             $geoloc['long'] = $row['long'];
             $geoloc['reverse_lookup'] = $row['reverse_lookup'];
             $geoloc['timestamp'] = $row['timestamp'];

             $geos[$ip] = $geoloc;
         } else {
             $geos[$ip] = "none";
         }
     }

    if ($geos[$ip] != "none"){
        return $ip;
    } else {
        return "";
    }
 }

foreach ($response as $tracerouteKey => $traceroute){

    $response[$tracerouteKey]['dst_as'] = generate_as($traceroute['dst_addr']);
    $response[$tracerouteKey]['from_as'] = generate_as($traceroute['from']);

    $response[$tracerouteKey]['dst_geo_key'] = get_geolocation($traceroute['dst_addr']);
    $response[$tracerouteKey]['from_geo_key'] = get_geolocation($traceroute['from']);

    foreach ($traceroute['result'] as $hopKey => $hop){
        if (isset($hop['result'])){
            foreach ($hop['result'] as $attemptKey => $attempt){

                if (isset($attempt['from'])){
                    $response[$tracerouteKey]['result'][$hopKey]['result'][$attemptKey]['as'] = generate_as($attempt['from']);
                    $response[$tracerouteKey]['result'][$hopKey]['result'][$attemptKey]['geo_key'] = get_geolocation($attempt['from']);
                }

            }
        }
    }

}

$json = '{"traceroutes":'.json_encode($response).', "ases":'.json_encode($ases_reverse).', "geolocations": '.json_encode($geos).'}';
if (isset($callback)){
    $json = $callback.'('.$json.')';
}

echo $json;
mysql_close($link);

?>