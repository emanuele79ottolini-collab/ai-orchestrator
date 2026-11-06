/**
 * Ogni parola della pagina. Testi di Emanuele Ottolini, AI Orchestrator.
 */

export const brand = {
  name: 'Emanuele Ottolini',
  tagline: 'AI Orchestrator',
  email: 'emanuele79.ottolini@gmail.com',
  place: 'Verona',
};

export const nav = [
  {label: 'Servizi', href: '#servizi'},
  {label: 'In azione', href: '#sistema'},
  {label: 'Metodo', href: '#metodo'},
  {label: 'Chi sono', href: '#chi'},
];

export const hero = {
  kicker: 'AI Orchestrator · Verona',
  title: ['AI', 'ORCHESTRATOR'],
  lead: ['Oggi l’IA non basta averla.', 'Bisogna saperla usare.'],
  body: 'Ti aiuto a togliere dal tuo lavoro le cose che fanno perdere tempo: email, preventivi, report, dati copiati a mano. Costruisco assistenti e automazioni su misura, e la landing page che presenta la tua offerta e raccoglie le richieste.',
  cta: 'Prenota una call gratuita',
  cta2: 'Come lavoro',
  site: 'Verona · 45.44°N 10.99°E',
  floats: [
    {title: 'Richiesta cliente gestita', meta: 'ESEMPIO · EMAIL → CRM'},
    {title: 'Preventivo in bozza', meta: 'ESEMPIO · PRONTO PER LA FIRMA'},
    {title: 'Report settimanale inviato', meta: 'ESEMPIO · OGNI VENERDÌ 08:00'},
  ],
  sig: [
    {t: 'Sicuro per design', s: 'Background in cybersecurity'},
    {t: 'Su misura', s: 'Niente pacchetti preconfezionati'},
    {t: 'Concreto', s: 'Ore risparmiate, non promesse'},
  ],
};

export const tools = ['ChatGPT', 'Claude', 'n8n', 'Make', 'Google Workspace', 'WhatsApp', 'Gmail', 'Calendario', 'CRM', 'Excel', 'Drive', 'Fatture', 'Slack', 'Notion'];

export const services = {
  eyebrow: 'Servizi',
  heading: 'Meno tempo perso. Più tempo per il tuo lavoro.',
  body: 'Chi usa bene l’intelligenza artificiale lavora più in fretta e risponde prima ai clienti. Non serve diventare esperti: serve qualcuno che costruisca il sistema giusto per te.',
  items: [
    {tag: 'Analisi', title: 'Capisco dove perdi tempo', body: 'Guardiamo insieme la tua giornata e troviamo i lavori ripetitivi che si possono togliere o velocizzare.', chips: ['Mappa attività', 'Priorità', 'Stima ore']},
    {tag: 'Agenti', title: 'Un assistente che lavora per te', body: 'Risponde ai clienti, prepara documenti, ricorda i solleciti. Con le tue regole, sempre sotto il tuo controllo.', chips: ['Claude', 'ChatGPT', 'WhatsApp']},
    {tag: 'Automazioni', title: 'Gli strumenti che parlano tra loro', body: 'Email, calendario, fogli e gestionale collegati: i dati passano da soli, senza copia e incolla.', chips: ['n8n', 'Make', 'Google Workspace']},
    {tag: 'Landing Page', title: 'Landing page su misura', body: 'Una pagina chiara, veloce e pensata per te, che presenta la tua offerta e fa arrivare le richieste. La progetto, la costruisco e la metto online io, collegata a email e calendario.', chips: ['Progetto', 'Costruzione', 'Messa online']},
    {tag: 'Persone', title: 'Formazione per il tuo team', body: 'Impari a usare l’IA nel lavoro di ogni giorno, con esempi dei tuoi casi reali.', chips: ['Workshop', 'Prompt', 'Sicurezza dati']},
  ],
};

export const flow = {
  eyebrow: 'In azione',
  heading: 'Una richiesta arriva. Il sistema fa il resto.',
  body: 'Un esempio di flusso orchestrato: l’agente legge, decide, aggiorna gli strumenti e ti chiede solo l’approvazione finale.',
  note: 'Esempio illustrativo. Ogni sistema viene disegnato sui tuoi strumenti.',
  events: [
    ['Email', 'n-email', 'Nuova richiesta di preventivo da un cliente'],
    ['Agente', 'agent', 'Legge il messaggio e capisce cosa serve'],
    ['CRM', 'n-crm', 'Contatto creato e collegato allo storico'],
    ['Calendario', 'n-cal', 'Propone due slot liberi per una call'],
    ['Fatture', 'n-inv', 'Prepara il preventivo in PDF, in bozza'],
    ['Tu', 'agent', 'Un tap per approvare. Il resto è già fatto'],
  ] as [string, string, string][],
};

/** Le quattro tappe del metodo, nell’ordine in cui vengono disegnate. */
export const method = {
  eyebrow: 'Metodo',
  heading: 'Dal caos al sistema, in quattro passi.',
  counter: 'Strumenti collegati',
  legs: [
    {day: 'Passo 1 · Ascolto', title: 'Mappa', body: 'Una call gratuita per capire cosa ti fa perdere tempo, quali strumenti usi e dove vuoi arrivare.', tag: 'Call gratuita'},
    {day: 'Passo 2 · Progetto', title: 'Disegna', body: 'Ti presento il sistema: chi fa cosa, quali dati, quanto tempo risparmi.', tag: 'Proposta scritta'},
    {day: 'Passo 3 · Regia', title: 'Orchestra', body: 'Costruisco agenti e automazioni collegati ai tuoi strumenti e, se serve, la tua landing page.', tag: 'Messa in opera'},
    {day: 'Passo 4 · Crescita', title: 'Misura', body: 'Controlliamo i risultati e miglioriamo il sistema nel tempo.', tag: 'Supporto continuo'},
  ],
};

export const about = {
  eyebrow: 'Chi sono',
  quote: 'Sono un sistemista, non un venditore di app. Costruisco cose che funzionano.',
  p1: 'Mi chiamo Emanuele. Lavoro da anni nell’amministrazione di sistemi e nella cybersecurity, dove un errore costa caro. Porto lo stesso rigore nell’intelligenza artificiale.',
  p2: 'Il mio obiettivo è semplice: semplificare il lavoro complesso con automazioni e un’organizzazione chiara, e generare valore concreto per chi collabora con me. Non ti vendo tecnologia: ti tolgo il lavoro che ti ruba tempo.',
};

export const contact = {
  eyebrow: 'Contatti',
  heading: 'Dimmi cosa ti fa perdere tempo.',
  body: 'Una call di 30 minuti, gratuita e senza impegno. Mi racconti come lavori, io ti dico cosa si può migliorare. Scegli il canale che preferisci: ti rispondo io, di persona.',
};
