/**
 * Logica dei tre moduli di contatto (Appuntamento, WhatsApp, Email), portata
 * dalla pagina precedente. Lavora direttamente sul DOM della sezione
 * #contatti e non passa dallo stato di React: i moduli restano non
 * controllati e non vengono mai ridisegnati.
 */

type Cfg = {
  whatsapp: string;
  email: string;
  endpoint: string;
  calendarEndpoint: string;
  bookingUrl: string;
  durataMinuti: number;
};

declare global {
  interface Window {
    SITE_CONFIG?: Partial<Cfg>;
  }
}

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Reply = {ok?: boolean; fallback?: boolean; errore?: string; calendario?: boolean; slots?: string[]};
type Values = Record<string, string>;

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c] as string);

export function initForms(root: HTMLElement): () => void {
  const ac = new AbortController();
  const on = {signal: ac.signal};
  const CFG: Cfg = {whatsapp: '', email: 'emanuele79.ottolini@gmail.com', endpoint: import.meta.env.BASE_URL + 'api/contatto.php', calendarEndpoint: import.meta.env.BASE_URL + 'api/calendario.php', bookingUrl: '', durataMinuti: 30, ...window.SITE_CONFIG};
  // config.js usa percorsi relativi ("api/..."): con le pagine in radice vanno resi assoluti.
  const abs = (u: string) => (/^(https?:)?\/\//.test(u) || u.startsWith('/') ? u : import.meta.env.BASE_URL + u);
  CFG.endpoint = abs(CFG.endpoint);
  CFG.calendarEndpoint = abs(CFG.calendarEndpoint);

  const $ = <T extends HTMLElement>(s: string, r: ParentNode = root) => r.querySelector<T>(s)!;
  const $$ = <T extends HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll<T>(s)];

  /* ---- schede ---- */
  const tabs = $$<HTMLButtonElement>('.tab');
  function openTab(name: string, focus?: boolean) {
    tabs.forEach((t) => {
      const sel = t.id === `t-${name}`;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      if (sel && focus) t.focus();
    });
    $$('.tp').forEach((p) => (p.hidden = p.id !== `p-${name}`));
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => openTab(t.id.slice(2)), on);
    t.addEventListener(
      'keydown',
      (e) => {
        const k = ({ArrowRight: 1, ArrowLeft: -1} as Record<string, number>)[e.key];
        if (!k) return;
        e.preventDefault();
        openTab(tabs[(i + k + tabs.length) % tabs.length].id.slice(2), true);
      },
      on,
    );
  });
  document.querySelectorAll<HTMLElement>('[data-tab]').forEach((a) => a.addEventListener('click', () => openTab(a.dataset.tab!), on));

  /* ---- utilità ---- */
  const status = (form: HTMLElement, msg: string, err?: boolean) => {
    const s = $('.st', form);
    s.textContent = msg;
    s.classList.toggle('err', !!err);
  };
  function validate(form: HTMLElement) {
    let first: Field | null = null;
    $$<Field>('input,select,textarea', form).forEach((el) => {
      el.classList.remove('bad');
      if (!el.checkValidity()) {
        el.classList.add('bad');
        first = first || el;
      }
    });
    const f = first as Field | null;
    if (f) {
      f.focus();
      status(form, f.validationMessage || 'Controlla i campi evidenziati.', true);
      return false;
    }
    status(form, '');
    return true;
  }
  const data = (form: HTMLFormElement): Values => {
    const o: Values = {};
    new FormData(form).forEach((v, k) => (o[k] = String(v).trim()));
    return o;
  };
  const mailto = (subject: string, body: string) => `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  async function send(payload: object, ep?: string): Promise<Reply> {
    try {
      const r = await fetch(ep || CFG.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      if ((!r.ok && r.status >= 500) || r.status === 404 || r.status === 405 || r.status === 501) return {ok: false, fallback: true};
      const j = (await r.json().catch(() => null)) as Reply | null;
      return j || {ok: false, fallback: true};
    } catch {
      return {ok: false, fallback: true};
    }
  }
  const lock = (form: HTMLElement, v: boolean) => $$<HTMLButtonElement>('button[type=submit]', form).forEach((b) => (b.disabled = v));
  const t0 = Date.now();

  /* ---- WhatsApp ---- */
  const fw = $<HTMLFormElement>('#f-whatsapp');
  fw.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      if (!validate(fw)) return;
      const d = data(fw);
      const text = `Ciao Emanuele, sono ${d.nome}.\n${d.messaggio}\n\n(Scritto dal tuo sito)`;
      const num = String(CFG.whatsapp || '').replace(/\D/g, '');
      if (!num) console.warn('WhatsApp: imposta il numero in config.js');
      const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
      const w = window.open(url, '_blank', 'noopener');
      if (!w) location.href = url;
      status(fw, 'Si sta aprendo WhatsApp con il messaggio pronto.');
    },
    on,
  );

  /* ---- Email ---- */
  const fe = $<HTMLFormElement>('#f-email');
  const de = $('#done-email');
  fe.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      if (!validate(fe)) return;
      const d: Values & {tipo?: string; t?: string} = data(fe);
      const payload = {...d, tipo: 'email', t: Math.round((Date.now() - t0) / 1000)};
      lock(fe, true);
      status(fe, 'Invio in corso…');
      const r = await send(payload);
      lock(fe, false);
      if (r.ok) {
        fe.hidden = true;
        de.hidden = false;
        de.innerHTML = `<h3>Richiesta inviata.</h3><p>Grazie ${esc(d.nome.split(' ')[0])}, ti rispondo all'indirizzo che hai indicato.</p><div class="act"><button class="btn ghost" type="button" id="again-email">Invia un'altra richiesta</button></div>`;
        $('#again-email', de).onclick = () => {
          fe.reset();
          fe.hidden = false;
          de.hidden = true;
          status(fe, '');
        };
      } else if (r.fallback) {
        location.href = mailto(d.oggetto || 'Richiesta dal sito', `${d.messaggio}\n\n${d.nome}${d.telefono ? ` · ${d.telefono}` : ''} · ${d.email}`);
        status(fe, 'Non riesco a inviare da qui: si è aperta la tua app di posta con il messaggio già pronto.');
      } else status(fe, r.errore || 'Invio non riuscito. Riprova tra poco.', true);
    },
    on,
  );

  /* ---- Appuntamento + Google Calendar ---- */
  const fa = $<HTMLFormElement>('#f-appuntamento');
  const da = $('#done-appuntamento');
  const giorno = $<HTMLInputElement>('#giorno');
  const ora = $<HTMLSelectElement>('#ora');
  const info = $('#slot-info');
  let live = false; // true quando il calendario Google è collegato sul server
  const FISSI = (() => {
    const o: string[] = [];
    for (let h = 9; h < 18; h++)
      for (const m of [0, 30]) {
        if (h === 13 || (h === 14 && m === 0)) continue;
        o.push(`${pad(h)}:${pad(m)}`);
      }
    return o;
  })();
  const riempi = (lista: string[], msg?: string) => {
    ora.innerHTML = `<option value="">${msg || "Scegli l'orario"}</option>${lista.map((s) => `<option>${s}</option>`).join('')}`;
  };
  riempi(FISSI);
  {
    const min = new Date();
    min.setDate(min.getDate() + 1);
    const max = new Date();
    max.setDate(max.getDate() + 60);
    giorno.min = ymd(min);
    giorno.max = ymd(max);
    if (CFG.bookingUrl) {
      const b = $<HTMLAnchorElement>('#booking');
      b.href = CFG.bookingUrl;
      b.hidden = false;
    }
  }
  async function caricaSlot() {
    if (!live || !giorno.value || giorno.validationMessage) return;
    ora.disabled = true;
    riempi([], 'Cerco gli orari liberi…');
    try {
      const r = await fetch(`${CFG.calendarEndpoint}?data=${encodeURIComponent(giorno.value)}`);
      const j = (await r.json()) as Reply;
      if (!j.ok || !j.slots) throw new Error('calendario');
      ora.disabled = false;
      if (!j.slots.length) {
        riempi([], 'Nessun orario libero');
        info.textContent = 'Quel giorno non ci sono orari liberi: prova un altro giorno.';
      } else {
        riempi(j.slots);
        info.textContent = 'Questi sono gli orari liberi nel mio calendario.';
      }
    } catch {
      live = false;
      ora.disabled = false;
      riempi(FISSI);
      info.textContent = '';
    }
  }
  giorno.addEventListener(
    'change',
    () => {
      const wd = new Date(`${giorno.value}T12:00:00`).getDay();
      giorno.setCustomValidity(wd === 0 || wd === 6 ? 'Scegli un giorno dal lunedì al venerdì.' : '');
      caricaSlot();
    },
    on,
  );
  fetch(`${CFG.calendarEndpoint}?stato=1`, {signal: ac.signal})
    .then((r) => r.json())
    .then((j: {attivo?: boolean}) => {
      live = !!(j && j.attivo);
      if (live) {
        info.textContent = 'Scegli il giorno: vedrai solo gli orari liberi nel mio calendario.';
        caricaSlot();
      }
    })
    .catch(() => {});

  const icsDate = (d: string, h: number, m: number) => `${d.replace(/-/g, '')}T${pad(h)}${pad(m)}00`;
  function calendarData(d: Values) {
    const [h, m] = d.ora.split(':').map(Number);
    const end = new Date(2000, 0, 1, h, m + CFG.durataMinuti);
    return {
      start: icsDate(d.giorno, h, m),
      fine: icsDate(d.giorno, end.getHours(), end.getMinutes()),
      titolo: 'Call con Emanuele Ottolini · AI Orchestrator',
      dettagli: `Call di ${CFG.durataMinuti} minuti per capire dove l'IA può farti risparmiare tempo.${d.messaggio ? `\n\nTema: ${d.messaggio}` : ''}\n\nOrario da confermare via email.`,
    };
  }
  type Cal = ReturnType<typeof calendarData>;
  const googleLink = (c: Cal) =>
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(c.titolo)}&dates=${c.start}/${c.fine}&ctz=Europe/Rome&details=${encodeURIComponent(c.dettagli)}&add=${encodeURIComponent(CFG.email)}`;
  function icsBlob(c: Cal) {
    const e = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const txt = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Emanuele Ottolini//Sito//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${c.start}-${Math.random().toString(36).slice(2)}@sito`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
      `DTSTART:${c.start}`, `DTEND:${c.fine}`, `SUMMARY:${e(c.titolo)}`, `DESCRIPTION:${e(c.dettagli)}`, 'STATUS:TENTATIVE', 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    return new Blob([txt], {type: 'text/calendar'});
  }
  const human = (d: Values) => `${new Date(`${d.giorno}T12:00:00`).toLocaleDateString('it-IT', {weekday: 'long', day: 'numeric', month: 'long'})} alle ${d.ora}`;

  fa.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      if (!validate(fa)) return;
      const d = data(fa);
      const payload: Values & {tipo?: string} = {...d, tipo: 'appuntamento', t: String(Math.round((Date.now() - t0) / 1000))};
      if (!live) payload.nome = `${d.nome} ${d.cognome}`.trim();
      lock(fa, true);
      status(fa, 'Invio in corso…');
      const r = await send(payload, live ? CFG.calendarEndpoint : CFG.endpoint);
      lock(fa, false);
      if (!r.ok && !r.fallback) {
        status(fa, r.errore || 'Invio non riuscito. Riprova tra poco.', true);
        if (live) caricaSlot();
        return;
      }
      const c = calendarData(d);
      fa.hidden = true;
      da.hidden = false;
      da.innerHTML =
        (r.ok
          ? `<h3>Richiesta inviata.</h3><p>Hai chiesto una call ${esc(human(d))}. ${r.calendario ? 'L\'ho già segnata nel mio calendario come "da confermare" e ti ho scritto una email di riepilogo. ' : ''}Ti confermo l'orario via email. Intanto puoi segnartela in agenda.</p>`
          : '<h3>Un ultimo passo.</h3><p>Non riesco a inviare direttamente da qui. Premi “Invia per email” per mandarmi la richiesta, poi segnati la call in agenda.</p>') +
        '<div class="act">' +
        (r.ok ? '' : `<a class="btn primary" id="fallback-mail" href="${esc(mailto(`Richiesta appuntamento ${d.giorno} ${d.ora}`, `Ciao Emanuele, vorrei una call ${human(d)}.\n${d.messaggio ? `Tema: ${d.messaggio}\n` : ''}\n${payload.nome} · ${d.email}`))}">Invia per email</a>`) +
        `<a class="btn ${r.ok ? 'primary' : 'ghost'}" target="_blank" rel="noopener" href="${esc(googleLink(c))}">Aggiungi a Google Calendar</a>` +
        '<a class="btn ghost" id="ics" href="#">Scarica .ics</a></div>';
      $('#ics', da).addEventListener('click', (ev) => {
        ev.preventDefault();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(icsBlob(c));
        a.download = 'call-emanuele-ottolini.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    },
    on,
  );

  /* ---- copia email ---- */
  const copy = $<HTMLButtonElement>('#copy');
  copy.addEventListener(
    'click',
    async () => {
      const addr = $('#addr');
      try {
        await navigator.clipboard.writeText(addr.textContent || '');
        copy.textContent = 'Copiato';
      } catch {
        const r = document.createRange();
        r.selectNodeContents(addr);
        const s = getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
        copy.textContent = 'Selezionato';
      }
      setTimeout(() => (copy.textContent = 'Copia'), 1800);
    },
    on,
  );

  return () => ac.abort();
}
