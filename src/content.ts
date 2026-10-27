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
  lead: ['L’IA ce l’hanno tutti.', 'Io la faccio lavorare insieme.'],
  body: 'Progetto e collego agenti, automazioni e strumenti di intelligenza artificiale in un unico sistema che lavora per la tua attività, ogni giorno, senza che tu debba pensarci.',
  cta: 'Prenota una call gratuita',
  cta2: 'Come lavoro',
  site: 'Verona · 45.44°N 10.99°E',
  floats: [
    {title: 'Richiesta cliente gestita', meta: 'EMAIL → CRM · 2 SEC'},
    {title: 'Preventivo in bozza', meta: 'PRONTO PER LA TUA FIRMA'},
    {title: 'Report settimanale inviato', meta: 'OGNI VENERDÌ · 08:00'},
  ],
  sig: [
    {t: 'Sicuro per design', s: 'Background in cybersecurity'},
    {t: 'Su misura', s: 'Niente pacchetti preconfezionati'},
    {t: 'Misurabile', s: 'Ore risparmiate, non promesse'},
  ],
};

export const tools = ['ChatGPT', 'Claude', 'n8n', 'Make', 'Google Workspace', 'WhatsApp', 'Gmail', 'Calendario', 'CRM', 'Excel', 'Drive', 'Fatture', 'Slack', 'Notion'];

export const services = {
  eyebrow: 'Servizi',
  heading: 'Dieci strumenti di IA. Nessuno che li dirige.',
  body: 'ChatGPT per i testi, un altro tool per le email, un foglio Excel che nessuno aggiorna. Ogni pezzo funziona da solo, ma il lavoro resta manuale. Serve una regia: quattro modi per metterla al tuo servizio.',
  items: [
    {tag: 'Analisi', title: 'Audit dei processi', body: 'Mappiamo come lavori oggi e troviamo le attività ripetitive che un sistema di IA può togliere dalla tua giornata.', chips: ['Mappa attività', 'Priorità', 'Stima ore']},
    {tag: 'Agenti', title: 'Agenti e assistenti su misura', body: 'Assistenti che rispondono ai clienti, preparano documenti, gestiscono solleciti e riassumono riunioni, con le tue regole.', chips: ['Claude', 'ChatGPT', 'WhatsApp']},
    {tag: 'Automazioni', title: 'Orchestrazione degli strumenti', body: 'Colleghiamo email, calendario, CRM, fogli e gestionali in flussi automatici che si attivano da soli.', chips: ['n8n', 'Make', 'Google Workspace']},
    {tag: 'Persone', title: 'Formazione del team', body: 'Il tuo team impara a usare l’IA in modo pratico e sicuro, con esercizi sui vostri casi reali.', chips: ['Workshop', 'Prompt', 'Sicurezza dati']},
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
    {day: 'Passo 1 · Ascolto', title: 'Mappa', body: 'Una call per capire obiettivi, strumenti e colli di bottiglia.', tag: 'Call gratuita'},
    {day: 'Passo 2 · Progetto', title: 'Disegna', body: 'Ti presento il sistema: chi fa cosa, quali dati, quanto tempo risparmi.', tag: 'Proposta scritta'},
    {day: 'Passo 3 · Regia', title: 'Orchestra', body: 'Costruisco agenti e automazioni e li collego ai tuoi strumenti.', tag: 'Messa in opera'},
    {day: 'Passo 4 · Crescita', title: 'Misura', body: 'Controlliamo i risultati e miglioriamo il sistema nel tempo.', tag: 'Supporto continuo'},
  ],
};

export const about = {
  eyebrow: 'Chi sono',
  quote: 'Sono un sistemista, non un venditore di app. Costruisco cose che funzionano.',
  p1: 'Mi chiamo Emanuele. Lavoro da anni nell’amministrazione di sistemi e nella cybersecurity, dove un errore costa caro. Porto lo stesso rigore nell’intelligenza artificiale.',
  p2: 'Il mio obiettivo è semplice: semplificare il lavoro complesso con automazioni e un’organizzazione chiara, e generare valore concreto per chi collabora con me.',
};

export const contact = {
  eyebrow: 'Contatti',
  heading: 'Parliamo di cosa può fare l’IA per te.',
  body: 'Una call di 30 minuti, gratuita e senza impegno. Scegli il canale che preferisci: ti rispondo io, di persona.',
};
