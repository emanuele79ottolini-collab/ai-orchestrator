<?php
/**
 * Prenotazione appuntamenti collegata a Google Calendar.
 *
 *   GET  calendario.php?stato=1          -> {"attivo":true|false}
 *   GET  calendario.php?data=YYYY-MM-DD  -> {"ok":true,"slots":["09:00",...]}   (orari liberi)
 *   POST calendario.php  (JSON)          -> crea l'evento nel calendario e avvisa per email
 *
 * Autenticazione: account di servizio Google (JWT), senza librerie esterne.
 * Se la chiave non c'è, "attivo" è false e il sito usa il modulo normale.
 */

ini_set('display_errors', '0');   // gli errori non devono mai finire nella risposta
$CFG = require __DIR__ . '/calendario-config.php';
$CFG += ['apiBase' => 'https://www.googleapis.com/calendar/v3', 'tokenUrl' => 'https://oauth2.googleapis.com/token'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function rispondi($codice, $dati) {
    http_response_code($codice);
    echo json_encode($dati, JSON_UNESCAPED_UNICODE);
    exit;
}
function pulisci($v, $max, $multilinea = false) {
    $v = (string)$v;
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    if (!$multilinea) $v = preg_replace('/\s+/u', ' ', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}
function b64u($d) { return rtrim(strtr(base64_encode($d), '+/', '-_'), '='); }

function attivo($CFG) { return is_file($CFG['chiave']) && function_exists('openssl_sign') && function_exists('curl_init'); }

/** Richiesta HTTPS con curl. Restituisce [codice, array|null]. */
function http($metodo, $url, $intestazioni = [], $corpo = null) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $metodo,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_HTTPHEADER     => $intestazioni,
    ]);
    if ($corpo !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $corpo);
    $r = curl_exec($ch);
    $codice = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return [$codice, $r === false ? null : json_decode($r, true)];
}

/** Token di accesso Google, in cache per circa 50 minuti. */
function token($CFG) {
    $cache = dirname($CFG['chiave']) . '/.google-token-cache';   // cartella privata, fuori dal sito
    if (is_file($cache) && filemtime($cache) > time() - 3000) {
        $t = trim((string)file_get_contents($cache));
        if ($t !== '') return $t;
    }
    $k = json_decode((string)file_get_contents($CFG['chiave']), true);
    if (!is_array($k) || empty($k['private_key']) || empty($k['client_email'])) return null;
    $ora = time();
    $in = b64u(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . b64u(json_encode([
        'iss' => $k['client_email'], 'scope' => 'https://www.googleapis.com/auth/calendar',
        'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $ora, 'exp' => $ora + 3600,
    ]));
    if (!openssl_sign($in, $firma, $k['private_key'], 'sha256WithRSAEncryption')) return null;
    [$cod, $r] = http('POST', $CFG['tokenUrl'],
        ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $in . '.' . b64u($firma)]));
    if ($cod !== 200 || empty($r['access_token'])) return null;
    @file_put_contents($cache, $r['access_token'], LOCK_EX);
    @chmod($cache, 0600);
    return $r['access_token'];
}

/** Impegni occupati nel periodo: elenco di [inizio, fine] come timestamp. */
function occupati($CFG, $da, $a) {
    $t = token($CFG);
    if (!$t) return null;
    [$cod, $r] = http('POST', $CFG['apiBase'] . '/freeBusy',
        ['Authorization: Bearer ' . $t, 'Content-Type: application/json'],
        json_encode(['timeMin' => $da->format('c'), 'timeMax' => $a->format('c'), 'timeZone' => $CFG['fuso'], 'items' => [['id' => $CFG['calendarId']]]]));
    if ($cod !== 200 || !isset($r['calendars'][$CFG['calendarId']]['busy'])) return null;
    $out = [];
    foreach ($r['calendars'][$CFG['calendarId']]['busy'] as $b) $out[] = [strtotime($b['start']), strtotime($b['end'])];
    return $out;
}

/** Orari di inizio possibili per un giorno (DateTime a mezzanotte), senza controllare il calendario. */
function slotDelGiorno($CFG, DateTime $giorno) {
    if (!in_array((int)$giorno->format('N'), $CFG['giorni'], true)) return [];
    $tz = $giorno->getTimezone();
    $min = new DateTime('now +' . (int)$CFG['preavviso'] . ' hours', $tz);
    $max = new DateTime('today +' . ((int)$CFG['finestra'] + 1) . ' days', $tz);
    $out = [];
    foreach ($CFG['fasce'] as [$da, $a]) {
        $s = DateTime::createFromFormat('!Y-m-d H:i', $giorno->format('Y-m-d') . ' ' . $da, $tz);
        $fine = DateTime::createFromFormat('!Y-m-d H:i', $giorno->format('Y-m-d') . ' ' . $a, $tz);
        while ((clone $s)->modify('+' . (int)$CFG['durata'] . ' minutes') <= $fine) {
            if ($s >= $min && $s <= $max) $out[] = clone $s;
            $s->modify('+' . (int)$CFG['passo'] . ' minutes');
        }
    }
    return $out;
}
function libero($CFG, DateTime $s, $busy) {
    $e = (clone $s)->modify('+' . (int)$CFG['durata'] . ' minutes');
    $m = (int)$CFG['margine'] * 60;
    foreach ($busy as [$bs, $be]) if ($s->getTimestamp() < $be + $m && $e->getTimestamp() > $bs - $m) return false;
    return true;
}
function giornoValido($CFG, $g) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$g)) return null;
    $d = DateTime::createFromFormat('!Y-m-d', $g, new DateTimeZone($CFG['fuso']));
    $err = DateTime::getLastErrors();
    if (!$d || ($err && ($err['warning_count'] || $err['error_count']))) return null;
    return $d;
}

/** Limite di richieste per indirizzo IP (il file contiene solo orari, il nome è un codice). */
function limite($prefisso, $attesa, $max) {
    foreach (glob(sys_get_temp_dir() . '/ottolini_' . $prefisso . '_*') ?: [] as $v) if (@filemtime($v) < time() - 3600) @unlink($v);
    $file = sys_get_temp_dir() . '/ottolini_' . $prefisso . '_' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'x') . '|sito');
    $ora = time(); $st = [];
    if (is_file($file)) $st = array_values(array_filter(array_map('intval', explode(',', (string)file_get_contents($file))), function ($t) use ($ora) { return $t > $ora - 3600; }));
    if ($st && end($st) > $ora - $attesa) return [false, 'Attendi qualche secondo prima di un nuovo invio.', $file, $st];
    if (count($st) >= $max) return [false, 'Troppe richieste. Riprova più tardi.', $file, $st];
    return [true, '', $file, $st];
}
function registra($file, $st) { $st[] = time(); @file_put_contents($file, implode(',', $st), LOCK_EX); }

// ============ GET ============
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    if (isset($_GET['stato'])) rispondi(200, ['attivo' => attivo($CFG)]);
    if (!attivo($CFG)) rispondi(200, ['ok' => false, 'attivo' => false]);
    [$ok, $msg, $fileReq, $stReq] = limite('slotreq', 0, 120);
    if (!$ok) rispondi(429, ['ok' => false, 'errore' => $msg]);
    registra($fileReq, $stReq);
    $giorno = giornoValido($CFG, $_GET['data'] ?? '');
    if (!$giorno) rispondi(422, ['ok' => false, 'errore' => 'Data non valida.']);
    $slots = slotDelGiorno($CFG, $giorno);
    if (!$slots) rispondi(200, ['ok' => true, 'slots' => []]);
    $busy = occupati($CFG, (clone $giorno), (clone $giorno)->modify('+1 day'));
    if ($busy === null) rispondi(502, ['ok' => false, 'errore' => 'Calendario non raggiungibile.']);
    $liberi = [];
    foreach ($slots as $s) if (libero($CFG, $s, $busy)) $liberi[] = $s->format('H:i');
    rispondi(200, ['ok' => true, 'slots' => $liberi]);
}

// ============ POST: prenotazione ============
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') rispondi(405, ['ok' => false, 'errore' => 'Metodo non consentito.']);

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

if (($in['sito_web'] ?? '') !== '') rispondi(200, ['ok' => true]);      // campo trappola
if ((int)($in['t'] ?? 0) < 3)       rispondi(200, ['ok' => true]);      // troppo veloce per un umano

[$ok, $msg, $fileLim, $storico] = limite('prenota', 30, 6);
if (!$ok) rispondi(429, ['ok' => false, 'errore' => $msg]);

$nome      = pulisci($in['nome'] ?? '', 60);
$cognome   = pulisci($in['cognome'] ?? '', 60);
$email     = pulisci($in['email'] ?? '', 120);
$messaggio = pulisci($in['messaggio'] ?? '', 800, true);
if ($nome === '' || $cognome === '')               rispondi(422, ['ok' => false, 'errore' => 'Inserisci nome e cognome.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    rispondi(422, ['ok' => false, 'errore' => 'Controlla l\'indirizzo email.']);
if (empty($in['consenso']))                        rispondi(422, ['ok' => false, 'errore' => 'Serve il consenso al trattamento dei dati.']);

$tz = new DateTimeZone($CFG['fuso']);
$g = giornoValido($CFG, $in['giorno'] ?? '');
$o = (string)($in['ora'] ?? '');
if (!$g || !preg_match('/^\d{2}:\d{2}$/', $o)) rispondi(422, ['ok' => false, 'errore' => 'Scegli giorno e orario.']);
$inizio = DateTime::createFromFormat('!Y-m-d H:i', $g->format('Y-m-d') . ' ' . $o, $tz);
if (!$inizio) rispondi(422, ['ok' => false, 'errore' => 'Orario non valido.']);

$permessi = array_map(function ($s) { return $s->format('H:i'); }, slotDelGiorno($CFG, $g));
if (!in_array($inizio->format('H:i'), $permessi, true)) rispondi(422, ['ok' => false, 'errore' => 'Questo orario non è disponibile. Scegline un altro.']);
$fine = (clone $inizio)->modify('+' . (int)$CFG['durata'] . ' minutes');
$quando = $inizio->format('d/m/Y \a\l\l\e H:i');
$completo = $nome . ' ' . $cognome;

// --- crea l'evento nel calendario (se configurato) ---
$link = '';
$inCalendario = false;
if (attivo($CFG)) {
    $busy = occupati($CFG, (clone $inizio)->modify('-1 day'), (clone $inizio)->modify('+2 days'));
    if ($busy !== null && !libero($CFG, $inizio, $busy)) {
        rispondi(409, ['ok' => false, 'errore' => 'Questo orario è stato appena occupato. Scegline un altro.']);
    }
    $t = token($CFG);
    if ($t) {
        [$cod, $ev] = http('POST', $CFG['apiBase'] . '/calendars/' . rawurlencode($CFG['calendarId']) . '/events',
            ['Authorization: Bearer ' . $t, 'Content-Type: application/json'],
            json_encode([
                'summary'     => "Call con $completo (da confermare)",
                'description' => "Richiesta dal sito.\nNome: $completo\nEmail: $email" . ($messaggio !== '' ? "\n\nTema:\n$messaggio" : ''),
                'start'       => ['dateTime' => $inizio->format('c'), 'timeZone' => $CFG['fuso']],
                'end'         => ['dateTime' => $fine->format('c'),   'timeZone' => $CFG['fuso']],
                'status'      => 'tentative',
                'colorId'     => '5',
                'reminders'   => ['useDefault' => true],
            ], JSON_UNESCAPED_UNICODE));
        if ($cod === 200 && !empty($ev['id'])) { $inCalendario = true; $link = $ev['htmlLink'] ?? ''; }
    }
}

// --- email: avviso a te, conferma di ricezione al cliente ---
$mittente = 'noreply@' . ($host !== '' && preg_match('/^[a-z0-9.-]+$/', $host) ? $host : 'localhost');
$da = mb_encode_mimeheader($CFG['nomeSito'], 'UTF-8', 'B') . " <$mittente>";
$base = ['MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', 'X-Mailer: sito-prenotazione'];

$righe = ["Nuova richiesta di appuntamento dal sito.", "", "Quando: $quando (durata " . (int)$CFG['durata'] . " min)", "Nome: $completo", "Email: $email"];
if ($messaggio !== '') { $righe[] = ''; $righe[] = 'Tema:'; $righe[] = $messaggio; }
$righe[] = '';
$righe[] = $inCalendario ? 'È già nel tuo Google Calendar, segnata "da confermare":' : 'ATTENZIONE: non è stato possibile scrivere nel calendario. Aggiungila a mano:';
$righe[] = $inCalendario ? $link : 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' . rawurlencode("Call con $completo")
        . '&dates=' . $inizio->format('Ymd\THis') . '/' . $fine->format('Ymd\THis') . '&ctz=' . rawurlencode($CFG['fuso']) . '&add=' . rawurlencode($email);
$okMail = mail($CFG['destinatario'], mb_encode_mimeheader("Richiesta appuntamento: $completo, $quando", 'UTF-8', 'B'),
    implode("\r\n", $righe), implode("\r\n", array_merge($base, ['From: ' . $da, 'Reply-To: ' . $email])));

if ($inCalendario || $okMail) {
    // conferma di ricezione al cliente: testo fisso, nessun contenuto scelto da chi compila
    @mail($email, mb_encode_mimeheader("Richiesta ricevuta: call del $quando", 'UTF-8', 'B'),
        implode("\r\n", ["Ciao $nome,", '', "ho ricevuto la tua richiesta per una call il $quando (durata " . (int)$CFG['durata'] . " minuti).", 'Ti confermo l\'appuntamento a breve, rispondendo a questo messaggio.', '', 'Emanuele Ottolini', 'AI Orchestrator · Verona']),
        implode("\r\n", array_merge($base, ['From: ' . $da, 'Reply-To: ' . $CFG['destinatario']])));
    registra($fileLim, $storico);
    rispondi(200, ['ok' => true, 'calendario' => $inCalendario]);
}
rispondi(500, ['ok' => false, 'errore' => 'Invio non riuscito.']);
