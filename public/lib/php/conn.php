<?php
$localhost = false;
$nome_db = "nome_db"

if($localhost)
{
    $dbConfig = [
        'host' => '127.0.0.1',
        'username' => 'root',
        'password' => 'root',
        'name' => $nome_db
    ];
}
else
{
    $dbConfig = [
        'host' => 'hostingweb14.netsons.net',
        'username' => 'tvuukipw_admin',
        'password' => 'webnovapasswordnova',
        'name' => 'tvuukipw_' . $nome_db
    ];
}

$con = mysqli_connect($dbConfig['host'], $dbConfig['username'], $dbConfig['password'], $dbConfig['name']);
if ($con->connect_errno) 
{
    die("Connection failed: " . $con->connect_error);
}
?>