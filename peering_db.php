<?php
header('Content-Type: application/json');
error_reporting(E_ERROR | E_WARNING | E_PARSE);
$type = $_GET['type'];
$callback = $_GET['callback'];


$output = "";

if ($type == "ixlan") {
    $output = file_get_contents("ixlan.txt");
} else if ($type == "ix") {
    $output = file_get_contents("ix.txt");
} else {
    $output = file_get_contents("ixpfx.txt");
}

print $callback.'('.$output.')';

?>