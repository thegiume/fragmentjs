<?php
header('Access-Control-Allow-Origin: *');

$path = preg_replace("!${_SERVER['SCRIPT_NAME']}$!", '', $_SERVER['SCRIPT_FILENAME']);
$path .= "/lib/php/conn.php";
include($path);

$id = $_POST['id'];

$sql = "SELECT * FROM nome_tabella WHERE id = '" . $id ."'";

$result = $con->query($sql);

if ($result->num_rows > 0) {
  $row = $result->fetch_assoc();
  header('Content-Type: application/json');
  echo json_encode($row);
} else {
  header('Content-Type: application/json');
  echo json_encode(["error" => "0 results"]);
}
$con->close();
?>
