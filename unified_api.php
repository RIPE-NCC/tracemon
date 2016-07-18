<?php
header('Content-Type: application/json');
error_reporting(E_ERROR | E_WARNING | E_PARSE);
$msm = $_GET['id'];
$start = $_GET['start'];
$stop = $_GET['stop'];
$callback = $_GET['callback'];
$ases = [];
$ases_reverse = [];
$link = mysql_connect('localhost', 'root', '');
mysql_select_db('as');

$url = 'https://atlas.ripe.net/api/v2/measurements/'.$msm.'/results.jsonp?start='.$start.'&stop='.$stop;
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

foreach ($response as $tracerouteKey => $traceroute){

    $response[$tracerouteKey]['dst_as'] = generate_as($traceroute['dst_addr']);
    $response[$tracerouteKey]['from_as'] = generate_as($traceroute['from']);

    foreach ($traceroute['result'] as $hopKey => $hop){
        if (isset($hop['result'])){
            foreach ($hop['result'] as $attemptKey => $attempt){

                if (isset($attempt['from'])){
                    $response[$tracerouteKey]['result'][$hopKey]['result'][$attemptKey]['as'] = generate_as($attempt['from']);
                }

            }
        }
    }

}

$json = '{"traceroutes":'.json_encode($response).', "ases":'.json_encode($ases_reverse).'}';
if (isset($callback)){
    $json = $callback.'('.$json.')';
}

echo $json;
mysql_close($link);

?>