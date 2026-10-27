import {useEffect, useRef} from 'react';
import {brand, contact} from '../content';
import {useReveals} from '../hooks/useReveals';
import {initForms} from '../lib/forms';

const Consent = () => (
  <label className="chk">
    <input name="consenso" type="checkbox" required />
    <span>
      Acconsento al trattamento dei miei dati per essere ricontattato.{' '}
      <a href="/privacy.html" target="_blank" rel="noopener">
        Privacy
      </a>{' '}
      ·{' '}
      <a href="/cookie.html" target="_blank" rel="noopener">
        Cookie
      </a>
    </span>
  </label>
);

const Honeypot = () => (
  <label className="hp" aria-hidden="true">
    Sito web
    <input name="sito_web" type="text" tabIndex={-1} autoComplete="off" />
  </label>
);

/**
 * Contatti. Le tre schede (Appuntamento, WhatsApp, Email) sono markup statico;
 * la logica vive in lib/forms.ts e lavora sul DOM, quindi React non le
 * ridisegna mai e lo stato dei moduli resta intatto.
 */
export function Contact() {
  const reveal = useReveals<HTMLElement>();
  const formsRef = useRef<HTMLDivElement>(null);

  useEffect(() => initForms(formsRef.current!), []);

  return (
    <section ref={reveal} id="contatti" aria-labelledby="contatti-title" className="relative overflow-hidden px-4 py-28 text-center sm:px-6 md:px-[6vw] md:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute -right-[10%] -bottom-[60%] -left-[10%] h-[120%] bg-[radial-gradient(50%_50%_at_50%_100%,rgba(255,138,61,0.22),transparent_70%),radial-gradient(40%_40%_at_65%_95%,rgba(127,200,255,0.18),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-[1120px] flex-col items-center gap-6">
        <p className="font-mono text-label text-ember uppercase" data-reveal>
          {contact.eyebrow}
        </p>
        <h2 id="contatti-title" className="max-w-[14em] text-display font-semibold text-white" data-reveal>
          {contact.heading}
        </h2>
        <p className="max-w-[32rem] text-[1.125rem] text-mist/80" data-reveal>
          {contact.body}
        </p>

        <div ref={formsRef} className="flex w-full flex-col items-center gap-6" data-reveal>
          <div className="panel">
            <div className="tabs" role="tablist" aria-label="Come vuoi contattarmi">
              <button className="tab" role="tab" id="t-appuntamento" aria-controls="p-appuntamento" aria-selected="true" type="button">
                Appuntamento
              </button>
              <button className="tab" role="tab" id="t-whatsapp" aria-controls="p-whatsapp" aria-selected="false" tabIndex={-1} type="button">
                WhatsApp
              </button>
              <button className="tab" role="tab" id="t-email" aria-controls="p-email" aria-selected="false" tabIndex={-1} type="button">
                Email
              </button>
            </div>

            {/* APPUNTAMENTO + Google Calendar */}
            <div className="tp" role="tabpanel" id="p-appuntamento" aria-labelledby="t-appuntamento">
              <form className="frm" id="f-appuntamento" noValidate>
                <p className="intro">Scegli giorno e orario per una call di 30 minuti. Ti confermo io via email.</p>
                <div className="row">
                  <label>
                    Nome
                    <input name="nome" type="text" autoComplete="given-name" required maxLength={60} />
                  </label>
                  <label>
                    Cognome
                    <input name="cognome" type="text" autoComplete="family-name" required maxLength={60} />
                  </label>
                </div>
                <label>
                  Email
                  <input name="email" type="email" autoComplete="email" required maxLength={120} />
                </label>
                <div className="row">
                  <label>
                    Giorno
                    <input name="giorno" id="giorno" type="date" required />
                  </label>
                  <label>
                    Orario
                    <select name="ora" id="ora" required defaultValue="" />
                  </label>
                </div>
                <p className="fine" id="slot-info" aria-live="polite" />
                <label>
                  <span>
                    Di cosa vuoi parlare <span className="opt">(facoltativo)</span>
                  </span>
                  <textarea name="messaggio" rows={3} maxLength={800} placeholder="Ad esempio: voglio automatizzare preventivi e risposte ai clienti" />
                </label>
                <Honeypot />
                <Consent />
                <div className="act">
                  <button className="btn primary" type="submit">
                    Richiedi l'appuntamento
                  </button>
                  <a className="alt" id="booking" href="#" target="_blank" rel="noopener" hidden>
                    Vedi la mia disponibilità →
                  </a>
                </div>
                <p className="st" role="status" aria-live="polite" />
              </form>
              <div className="done" id="done-appuntamento" hidden />
            </div>

            {/* WHATSAPP */}
            <div className="tp" role="tabpanel" id="p-whatsapp" aria-labelledby="t-whatsapp" hidden>
              <form className="frm" id="f-whatsapp" noValidate>
                <p className="intro">Scrivimi la tua richiesta: si apre WhatsApp con il messaggio già pronto, ti basta premere invio.</p>
                <label>
                  Il tuo nome
                  <input name="nome" type="text" autoComplete="name" required maxLength={80} />
                </label>
                <label>
                  La tua richiesta
                  <textarea name="messaggio" rows={4} required maxLength={800} placeholder="Raccontami in due righe cosa vorresti migliorare nel tuo lavoro" />
                </label>
                <p className="fine">
                  Il sito non memorizza nulla.{' '}
                  <a href="/privacy.html" target="_blank" rel="noopener">
                    Privacy
                  </a>{' '}
                  ·{' '}
                  <a href="/cookie.html" target="_blank" rel="noopener">
                    Cookie
                  </a>
                </p>
                <div className="act">
                  <button className="btn primary wa" type="submit">
                    Apri WhatsApp
                  </button>
                </div>
                <p className="st" role="status" aria-live="polite" />
              </form>
            </div>

            {/* EMAIL */}
            <div className="tp" role="tabpanel" id="p-email" aria-labelledby="t-email" hidden>
              <form className="frm" id="f-email" noValidate>
                <p className="intro">Descrivimi la tua richiesta. Ti rispondo via email, di norma entro un giorno lavorativo.</p>
                <div className="row">
                  <label>
                    Nome e cognome
                    <input name="nome" type="text" autoComplete="name" required maxLength={80} />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" autoComplete="email" required maxLength={120} />
                  </label>
                </div>
                <div className="row">
                  <label>
                    <span>
                      Telefono <span className="opt">(facoltativo)</span>
                    </span>
                    <input name="telefono" type="tel" autoComplete="tel" maxLength={30} />
                  </label>
                  <label>
                    Oggetto
                    <input name="oggetto" type="text" maxLength={120} placeholder="Richiesta di informazioni" />
                  </label>
                </div>
                <label>
                  Messaggio
                  <textarea name="messaggio" rows={4} required maxLength={2000} />
                </label>
                <Honeypot />
                <Consent />
                <div className="act">
                  <button className="btn primary" type="submit">
                    Invia la richiesta
                  </button>
                </div>
                <p className="st" role="status" aria-live="polite" />
              </form>
              <div className="done" id="done-email" hidden />
            </div>
          </div>

          <div className="mail">
            <span>Oppure scrivimi a</span>
            <code id="addr">{brand.email}</code>
            <button className="copybtn" id="copy" type="button">
              Copia
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
