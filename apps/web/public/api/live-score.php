<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.fibalon-baskets.de');
header('Cache-Control: no-cache, no-store, must-revalidate');

$dataFile = __DIR__ . '/../../data/game-data.json';

if (!file_exists($dataFile)) {
    http_response_code(204);
    echo json_encode(null);
    exit;
}

$raw = file_get_contents($dataFile);
$game = json_decode($raw, true);

if (!is_array($game) || empty($game['isLive'])) {
    http_response_code(204);
    echo json_encode(null);
    exit;
}

echo $raw;
