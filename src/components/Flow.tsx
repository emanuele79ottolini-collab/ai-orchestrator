import {useEffect, useRef, useState} from 'react';
import {flow} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {useReveals} from '../hooks/useReveals';

type Entry = {id: number; time: string; who: string; text: string};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Un flusso orchestrato: arriva una richiesta, l'agente la legge e aggiorna
 * gli strumenti. Lo schema si accende nodo per nodo mentre il registro scorre.
 * Il registro cambia ogni 2 secondi e solo finché la sezione è visibile.
 */
export function Flow() {
  const ref = useReveals<HTMLElement>();
  const logRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const [log, setLog] = useState<Entry[]>([]);
  const [active, setActive] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    let i = 0;
    let sec = 2;
    let min = 41;
    let timer: number | null = null;

    const add = () => {
      const [who, node, text] = flow.events[i % flow.events.length];
      sec += 3 + ((i * 7) % 4);
      if (sec >= 60) {
        sec -= 60;
        min++;
      }
      const entry: Entry = {id: i, time: `09:${pad(min)}:${pad(sec)}`, who, text};
      setLog((l) => [...l, entry].slice(-6));
      setActive(node);
      setTick((t) => t + 1);
      i++;
    };

    if (reduced) {
      for (let k = 0; k < 5; k++) add();
      return;
    }
    const start = () => {
      if (timer === null) {
        add();
        timer = window.setInterval(add, 2200);
      }
    };
    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), {threshold: 0.3});
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [reduced]);

  const on = (id: string) => (active === id ? ' on' : '');

  return (
    <section ref={ref} id="sistema" aria-labelledby="sistema-title" className="relative px-4 py-28 sm:px-6 md:px-[6vw] md:py-40">
      <div className="max-w-[44rem]" data-reveal>
        <p className="font-mono text-label text-sky uppercase">{flow.eyebrow}</p>
        <h2 id="sistema-title" className="mt-4 text-display font-semibold text-white">
          {flow.heading}
        </h2>
        <p className="mt-5 max-w-[34rem] text-body text-mist/80">{flow.body}</p>
      </div>

      <div className="live mt-14 md:mt-20">
        <div data-reveal>
          <svg className="flow" viewBox="0 0 560 340" role="img" aria-label="Schema: una email arriva all'agente IA, che aggiorna CRM, calendario e fatture">
            <defs>
              <radialGradient id="cg" cx="40%" cy="35%">
                <stop offset="0" stopColor="#ffd2a8" />
                <stop offset="1" stopColor="#ff8a3d" />
              </radialGradient>
            </defs>
            <path id="p1" className="ln" d="M125 170 L238 170" />
            <path id="p2" className="ln" d="M322 170 C385 170 395 60 435 60" />
            <path id="p3" className="ln" d="M322 170 L435 170" />
            <path id="p4" className="ln" d="M322 170 C385 170 395 280 435 280" />
            <g className={`g${on('n-email')}`}>
              <rect className="nd" x="15" y="148" width="110" height="44" rx="14" />
              <text x="70" y="170">Email</text>
            </g>
            <circle key={tick} className={`halo${active === 'agent' ? ' on' : ''}`} cx="280" cy="170" r="42" />
            <circle className="core" cx="280" cy="170" r="42" />
            <text className="core-t" x="280" y="170">Agente IA</text>
            <g className={`g${on('n-crm')}`}>
              <rect className="nd" x="435" y="38" width="110" height="44" rx="14" />
              <text x="490" y="60">CRM</text>
            </g>
            <g className={`g${on('n-cal')}`}>
              <rect className="nd" x="435" y="148" width="110" height="44" rx="14" />
              <text x="490" y="170">Calendario</text>
            </g>
            <g className={`g${on('n-inv')}`}>
              <rect className="nd" x="435" y="258" width="110" height="44" rx="14" />
              <text x="490" y="280">Fatture</text>
            </g>
            {!reduced && (
              <g className="dots">
                <circle className="dot" r="4">
                  <animateMotion dur="2.4s" repeatCount="indefinite">
                    <mpath href="#p1" />
                  </animateMotion>
                </circle>
                <circle className="dot b" r="4">
                  <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite">
                    <mpath href="#p2" />
                  </animateMotion>
                </circle>
                <circle className="dot b" r="4">
                  <animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite">
                    <mpath href="#p3" />
                  </animateMotion>
                </circle>
                <circle className="dot b" r="4">
                  <animateMotion dur="2.4s" begin="1.8s" repeatCount="indefinite">
                    <mpath href="#p4" />
                  </animateMotion>
                </circle>
              </g>
            )}
          </svg>
        </div>
        <div data-reveal>
          <div className="term" aria-hidden="true">
            <header>
              <i />
              <i />
              <i />
              <span>REGISTRO · ESEMPIO</span>
            </header>
            <ol ref={logRef}>
              {log.map((e, k) => (
                <li key={e.id} className={k === log.length - 1 ? 'last' : ''}>
                  <span>{e.time}</span>
                  <b>{e.who}</b>
                  <em>{e.text}</em>
                </li>
              ))}
            </ol>
          </div>
          <p className="note">{flow.note}</p>
        </div>
      </div>
    </section>
  );
}
