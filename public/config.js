/* Impostazioni dei moduli di contatto. Modifica qui, non serve toccare altro. */
window.SITE_CONFIG = {
  // Numero WhatsApp in formato internazionale, solo cifre, senza + e senza spazi.
  // Esempio per un cellulare italiano: "393331234567"
  whatsapp: "393479040603",

  // Email che riceve le richieste (usata anche come invitato nell'evento Google Calendar).
  email: "emanuele79.ottolini@gmail.com",

  // Facoltativo: link alla tua pagina di prenotazione di Google Calendar
  // (Calendar > Crea > Pianificazione appuntamenti). Se lo inserisci, sotto il modulo
  // compare "Vedi la mia disponibilità". Lascia vuoto per non mostrarlo.
  bookingUrl: "",

  // Durata della call, in minuti.
  durataMinuti: 30,

  // Script che invia le email e quello che legge/scrive il Google Calendar (non modificare).
  endpoint: "api/contatto.php",
  calendarEndpoint: "api/calendario.php"
};
