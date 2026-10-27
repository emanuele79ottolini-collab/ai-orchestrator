<?php
/**
 * Impostazioni della prenotazione collegata a Google Calendar.
 * Finché il file della chiave non esiste, il sito usa il modulo normale (richiesta via email).
 * Istruzioni passo passo: GUIDA-GOOGLE-CALENDAR.md
 */
return [
    // Il calendario dove compaiono le prenotazioni: di solito il tuo indirizzo Gmail.
    'calendarId' => 'emanuele79.ottolini@gmail.com',

    // Dove sta il file JSON della chiave Google. Sta FUORI dalla cartella pubblica del sito:
    // dopo l'upload su Hostinger è la cartella che contiene public_html.
    'chiave' => dirname(__DIR__, 2) . '/google-calendar-key.json',

    'fuso'        => 'Europe/Rome',
    'durata'      => 30,            // minuti per ogni call
    'passo'       => 30,            // ogni quanti minuti parte uno slot
    'giorni'      => [1, 2, 3, 4, 5], // 1 = lunedì ... 7 = domenica
    'fasce'       => [['09:00', '13:00'], ['14:30', '18:00']],
    'preavviso'   => 24,            // ore minime tra adesso e la call
    'finestra'    => 60,            // giorni nel futuro in cui si può prenotare
    'margine'     => 0,             // minuti liberi da lasciare prima/dopo altri impegni
    'destinatario'=> 'emanuele79.ottolini@gmail.com',   // chi riceve l'avviso email
    'nomeSito'    => 'Sito Emanuele Ottolini',
];
