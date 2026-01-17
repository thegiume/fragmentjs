<?php
header('Access-Control-Allow-Origin: *');

$path = preg_replace("!${_SERVER['SCRIPT_NAME']}$!", '', $_SERVER['SCRIPT_FILENAME']);
$path .= "/lib/php/conn.php";
include($path);

// Prepara una query SQL utilizzando i prepared statements
$stmt = $con->prepare("INSERT INTO nome_tabella (par1, par2, par3, par4) VALUES (?, ?, ?, ?)");

// 's' specifica che il parametro è una stringa
$stmt->bind_param("ssss", $par1, $par2, $par3, $ig_user);

// Ricevi le variabili dal metodo POST e assegnale
$par1 = $_POST['par1'];
$par2 = $_POST['par2'];
$par3 = $_POST['par3'];
$par4 = $_POST['par4'];

// Esegui la query preparata
$stmt->execute();

echo "Nuovo record inserito con successo";

// Chiudi lo statement e la connessione
$stmt->close();
$con->close();
?>