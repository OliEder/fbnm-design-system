<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Honeypot: bots fill this field, humans don't see it
if (!empty($_POST['website'])) {
    http_response_code(400);
    echo json_encode(['success' => true]); // silent fail
    exit;
}

$name    = strip_tags(trim((string)($_POST['name'] ?? '')));
$email   = filter_var(trim((string)($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$subject = strip_tags(trim((string)($_POST['subject'] ?? 'Kontaktanfrage via Website')));
$message = strip_tags(trim((string)($_POST['message'] ?? '')));

if (!$name || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Bitte alle Pflichtfelder ausfuellen.']);
    exit;
}

if (strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Nachricht zu lang (max. 5000 Zeichen).']);
    exit;
}

$to = 'pr@fibalon-baskets.de';
$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    "From: FBNM Website <noreply@fibalon-baskets.de>",
    "Reply-To: $name <$email>",
    'X-Mailer: PHP',
]);

$body = "Name: $name\nE-Mail: $email\nBetreff: $subject\n\n$message";

if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Nachricht gesendet!']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Senden. Bitte erneut versuchen.']);
}
