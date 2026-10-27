<?php
/**
 * Riceve le richieste dai moduli del sito (email e appuntamento) e le gira per email.
 * Funziona su Hostinger senza configurazioni: usa la funzione mail() di PHP.
 */

ini_set('display_errors', '0');   // gli errori non devono mai finire nella risposta
// ---- impostazioni ----
const DESTINATARIO = 'emanuele79.ottolini@gmail.com';
const NOME_SITO    = 'Sito Emanuele Ottolini';
const FUSO         = 'Europe/Rome';
const DURATA_MIN   = 30;
const ATTESA_SEC   = 30;   // pausa minima tra due invii dallo stesso indirizzo IP
const MAX_ORA      = 8;    // invii massimi all'ora per indirizzo IP

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function rispondi(int $codice, array $dati) {
    http_response_code($codice);
    echo json_encode($dati, JSON_UNESCAPED_UNICODE);
    exit;
}
function pulisci(?string $v, int $max, bool $multilinea = false): string {
    $v = (string)$v;
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    if (!$multilinea) $v = preg_replace('/\s+/u', ' ', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    rispondi(405, ['ok' => false, 'errore' => 'Metodo non consentito.']);
}

// Accetta solo richieste che arrivano dal sito stesso
$host = preg_replace('/(^www\.|:\d+$)/i', '', strtolower($_SERVER['HTTP_HOST'] ?? ''));
$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origine !== '') {
    $oh = preg_replace('/^www\./i', '', strtolower((string)parse_url($origine, PHP_URL_HOST)));
    if ($oh !== $host) rispondi(403, ['ok' => false, 'errore' => 'Richiesta non consentita.']);
}

$corpo = file_get_contents('php://input');
if ($corpo === false || strlen($corpo) > 20000) rispondi(413, ['ok' => false, 'errore' => 'Richiesta troppo grande.']);
$in = json_decode($corpo, true);
if (!is_array($in)) rispondi(400, ['ok' => false, 'errore' => 'Dati non validi.']);

// Anti-spam: campo trappola e tempo minimo di compilazione
if (($in['sito_web'] ?? '') !== '') rispondi(200, ['ok' => true]);          // finge di aver inviato
if ((int)($in['t'] ?? 0) < 3)       rispondi(200, ['ok' => true]);

// Limite di invii per indirizzo IP
foreach (glob(sys_get_temp_dir() . '/ottolini_contatto_*') ?: [] as $vecchio) {
    if (@filemtime($vecchio) < time() - 3600) @unlink($vecchio);   // pulizia: nulla resta oltre un'ora
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$file = sys_get_temp_dir() . '/ottolini_contatto_' . hash('sha256', $ip . '|sito');
$ora = time();
$storico = [];
if (is_file($file)) {
    $storico = array_values(array_filter(array_map('intval', explode(',', (string)file_get_contents($file))), fn($t) => $t > $ora - 3600));
}
if ($storico && end($storico) > $ora - ATTESA_SEC) rispondi(429, ['ok' => false, 'errore' => 'Attendi qualche secondo prima di un nuovo invio.']);
if (count($storico) >= MAX_ORA)                    rispondi(429, ['ok' => false, 'errore' => 'Troppe richieste. Riprova più tardi.']);

// ---- validazione ----
$tipo     = ($in['tipo'] ?? '') === 'appuntamento' ? 'appuntamento' : 'email';
$nome     = pulisci($in['nome'] ?? '', 80);
$email    = pulisci($in['email'] ?? '', 120);
$telefono = pulisci($in['telefono'] ?? '', 30);
$oggetto  = pulisci($in['oggetto'] ?? '', 120);
$messaggio = pulisci($in['messaggio'] ?? '', 2000, true);

if ($nome === '')                                  rispondi(422, ['ok' => false, 'errore' => 'Inserisci il tuo nome.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    rispondi(422, ['ok' => false, 'errore' => 'Controlla l\'indirizzo email.']);
if (empty($in['consenso']))                        rispondi(422, ['ok' => false, 'errore' => 'Serve il consenso al trattamento dei dati.']);
if ($tipo === 'email' && mb_strlen($messaggio) < 5) rispondi(422, ['ok' => false, 'errore' => 'Scrivi un messaggio.']);

$linkCalendar = '';
$quando = '';
if ($tipo === 'appuntamento') {
    $g = (string)($in['giorno'] ?? '');
    $o = (string)($in['ora'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $g) || !preg_match('/^\d{2}:\d{2}$/', $o)) {
        rispondi(422, ['ok' => false, 'errore' => 'Scegli giorno e orario.']);
    }
    $tz = new DateTimeZone(FUSO);
    $inizio = DateTime::createFromFormat('!Y-m-d H:i', "$g $o", $tz);
    $err = DateTime::getLastErrors();
    if (!$inizio || ($err && ($err['warning_count'] || $err['error_count']))) rispondi(422, ['ok' => false, 'errore' => 'Data non valida.']);
    if ($inizio <= new DateTime('now', $tz)) rispondi(422, ['ok' => false, 'errore' => 'Scegli un orario futuro.']);
    if ((int)$inizio->format('N') > 5)       rispondi(422, ['ok' => false, 'errore' => 'Scegli un giorno dal lunedì al venerdì.']);
    $fine = (clone $inizio)->modify('+' . DURATA_MIN . ' minutes');
    $quando = $inizio->format('d/m/Y \a\l\l\e H:i');
    $linkCalendar = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        . '&text=' . rawurlencode("Call con $nome · AI Orchestrator")
        . '&dates=' . $inizio->format('Ymd\THis') . '/' . $fine->format('Ymd\THis')
        . '&ctz=' . rawurlencode(FUSO)
        . '&details=' . rawurlencode("Call di " . DURATA_MIN . " minuti.\nContatto: $nome <$email>" . ($messaggio !== '' ? "\n\nTema: $messaggio" : ''))
        . '&add=' . rawurlencode($email);
}

// ---- costruzione email ----
if ($tipo === 'appuntamento') {
    $subject = "Richiesta appuntamento: $nome, $quando";
    $righe = ["Nuova richiesta di appuntamento dal sito.", "", "Quando: $quando (durata " . DURATA_MIN . " min)", "Nome: $nome", "Email: $email"];
    if ($messaggio !== '') { $righe[] = ''; $righe[] = "Tema:"; $righe[] = $messaggio; }
    $righe[] = ''; $righe[] = 'Aggiungi al tuo Google Calendar (invita anche il cliente):'; $righe[] = $linkCalendar;
} else {
    $subject = 'Richiesta dal sito' . ($oggetto !== '' ? ": $oggetto" : " di $nome");
    $righe = ["Nuova richiesta dal sito.", "", "Nome: $nome", "Email: $email"];
    if ($telefono !== '') $righe[] = "Telefono: $telefono";
    $righe[] = ''; $righe[] = $messaggio;
}
$righe[] = ''; $righe[] = '— Inviato dal modulo del sito';
$testo = implode("\r\n", $righe);

$mittente = 'noreply@' . ($host !== '' && preg_match('/^[a-z0-9.-]+$/', $host) ? $host : 'localhost');
$intestazioni = [
    'From: ' . mb_encode_mimeheader(NOME_SITO, 'UTF-8', 'B') . " <$mittente>",
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: sito-contatto',
];
$ok = mail(DESTINATARIO, mb_encode_mimeheader($subject, 'UTF-8', 'B'), $testo, implode("\r\n", $intestazioni));

if (!$ok) rispondi(500, ['ok' => false, 'errore' => 'Invio non riuscito.']);

$storico[] = $ora;
@file_put_contents($file, implode(',', $storico), LOCK_EX);
rispondi(200, ['ok' => true]);
