import {useEffect, useRef, useState} from 'react';
import {method} from '../content';
import {clamp, easeOutCubic, pinProgress, range} from '../lib/math';
import {onFrame} from '../lib/scroll';

/**
 * Dal caos al sistema, disegnato mentre scorri. La sezione si blocca e le
 * quattro tappe del metodo si tracciano una dopo l'altra, con un puntino che
 * corre sul tratto in corso; durante il passo centrale il contatore sale fino
 * a dieci strumenti collegati.
 */

const SECTION_VH = 380;
const WINDOW = [0.06, 0.92] as const;
const TOOLS = 10;

const CHAOS = {cx: 230, cy: 320, r: 92};
const SYSTEM = {cx: 985, cy: 300, r: 46};

const LEGS = [
  // Mappa: un giro e un po' intorno al caos.
  `M${CHAOS.cx} ${CHAOS.cy - 128} a128 128 0 1 1 -0.1 0 a128 128 0 0 1 106 57`,
  // Disegna: la traiettoria dal caos al sistema.
  `M${CHAOS.cx + 106} ${CHAOS.cy - 71} C 520 40, 820 70, ${SYSTEM.cx - 20} ${SYSTEM.cy - 84}`,
  // Orchestra: si entra in orbita intorno al sistema.
  `M${SYSTEM.cx - 20} ${SYSTEM.cy - 84} a86 86 0 1 1 -0.1 0.2 a86 86 0 0 1 20 1`,
  // Misura: l'ultimo tratto verso il risultato.
  `M${SYSTEM.cx} ${SYSTEM.cy - 86} Q ${SYSTEM.cx + 40} ${SYSTEM.cy - 70} ${SYSTEM.cx + 30} ${SYSTEM.cy - 36}`,
];

/** Punti sparsi, fissi, dentro il cerchio del caos. */
const SCATTER = Array.from({length: 22}, (_, i) => {
  const a = i * 2.399963;
  const d = Math.sqrt((i + 1) / 22) * (CHAOS.r - 10);
  return {x: CHAOS.cx + Math.cos(a) * d, y: CHAOS.cy + Math.sin(a) * d, r: i % 5 === 0 ? 3.4 : 2};
});

const NODES = [
  [-22, -18],
  [24, -10],
  [8, 24],
  [-26, 14],
];

export function Method() {
  const rootRef = useRef<HTMLElement>(null);
  const legRefs = useRef<SVGPathElement[]>([]);
  const capsuleRef = useRef<SVGGElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [leg, setLeg] = useState(0);

  useEffect(() => {
    let lastP = -1;
    let current = 0;
    return onFrame(() => {
      const root = rootRef.current;
      if (!root) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const u = range(p, ...WINDOW) * LEGS.length;
      const s = clamp(Math.floor(u), 0, LEGS.length - 1);
      if (s !== current) {
        current = s;
        setLeg(s);
      }
      legRefs.current.forEach((path, i) => {
        const k = easeOutCubic(clamp(u - i));
        path.style.strokeDashoffset = String(1 - k);
        if (i === s) {
          const pt = path.getPointAtLength(path.getTotalLength() * k);
          capsuleRef.current!.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        }
      });
      const coast = easeOutCubic(clamp(u - 1));
      countRef.current!.textContent = String(Math.round(coast * TOOLS));
    });
  }, []);

  const current = method.legs[leg];

  return (
    <section ref={rootRef} id="metodo" aria-labelledby="metodo-title" className="relative" style={{height: `${SECTION_VH}svh`}}>
      <div className="sticky top-0 flex h-screen-s flex-col overflow-hidden px-4 pt-20 pb-8 sm:px-6 md:px-[6vw] md:pt-24">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-label text-sky uppercase">{method.eyebrow}</p>
            <h2 id="metodo-title" className="mt-3 max-w-[20ch] text-display font-semibold text-white">
              {method.heading}
            </h2>
          </div>
          <p className="font-mono text-label text-mist/70 uppercase" aria-live="off">
            {method.counter} <span ref={countRef} className="text-white tabular-nums">0</span> / {TOOLS}
          </p>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center">
          <svg viewBox="0 0 1200 600" className="h-auto max-h-full w-full" role="img" aria-label="Il percorso dal caos al sistema, tracciato in quattro tappe.">
            <defs>
              <radialGradient id="sys-shade" cx="38%" cy="35%" r="75%">
                <stop offset="0" stopColor="#ffd2a8" />
                <stop offset="0.75" stopColor="#ff8a3d" />
                <stop offset="1" stopColor="#8a3a10" />
              </radialGradient>
              <radialGradient id="sys-glow">
                <stop offset="0.6" stopColor="#ff8a3d" stopOpacity="0.32" />
                <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="chaos-glow">
                <stop offset="0.8" stopColor="#7fc8ff" stopOpacity="0.28" />
                <stop offset="1" stopColor="#7fc8ff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Campo di stelle appena accennato. */}
            <g fill="#fff">
              {Array.from({length: 70}, (_, i) => (
                <circle key={i} cx={(i * 173) % 1200} cy={(i * 97) % 600} r={i % 7 === 0 ? 1.4 : 0.7} opacity={0.15 + ((i * 37) % 50) / 100} />
              ))}
            </g>

            {/* Il caos: una nuvola di strumenti sparsi. */}
            <circle cx={CHAOS.cx} cy={CHAOS.cy} r={CHAOS.r * 1.18} fill="url(#chaos-glow)" />
            <circle cx={CHAOS.cx} cy={CHAOS.cy} r={CHAOS.r} fill="rgba(127,200,255,0.05)" stroke="rgba(127,200,255,0.35)" strokeDasharray="2 6" />
            <g fill="#cfe8ff">
              {SCATTER.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity="0.85" />
              ))}
            </g>

            {/* Il sistema: un nucleo con i suoi nodi collegati. */}
            <circle cx={SYSTEM.cx} cy={SYSTEM.cy} r={SYSTEM.r * 2.1} fill="url(#sys-glow)" />
            <circle cx={SYSTEM.cx} cy={SYSTEM.cy} r={SYSTEM.r} fill="url(#sys-shade)" />
            <g stroke="#0b0b0d" strokeOpacity="0.55" strokeWidth="1.2" fill="none">
              {NODES.map(([x, y], i) => (
                <line key={i} x1={SYSTEM.cx} y1={SYSTEM.cy} x2={SYSTEM.cx + x} y2={SYSTEM.cy + y} />
              ))}
            </g>
            <g fill="#0b0b0d">
              {NODES.map(([x, y], i) => (
                <circle key={i} cx={SYSTEM.cx + x} cy={SYSTEM.cy + y} r="3.6" />
              ))}
              <circle cx={SYSTEM.cx} cy={SYSTEM.cy} r="5.5" />
            </g>

            {/* L'ombra dell'intero percorso, poi i tratti inchiostrati sopra. */}
            {LEGS.map((d, i) => (
              <path key={`g${i}`} d={d} fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="3 6" />
            ))}
            {LEGS.map((d, i) => (
              <path
                key={i}
                ref={(el) => {
                  if (el) legRefs.current[i] = el;
                }}
                d={d}
                pathLength={1}
                fill="none"
                stroke={i === 1 ? '#7fc8ff' : '#f2e6c9'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="1 1"
                strokeDashoffset="1"
              />
            ))}

            <g ref={capsuleRef} transform={`translate(${CHAOS.cx} ${CHAOS.cy - 128})`}>
              <circle r="11" fill="#7fc8ff" opacity="0.25" />
              <circle r="4.5" fill="#fff" />
            </g>

            <g fontFamily="Geist Mono, monospace" fontSize="13" letterSpacing="2" fill="#a9acb4">
              <text x={CHAOS.cx} y={CHAOS.cy + CHAOS.r + 58} textAnchor="middle">
                CAOS
              </text>
              <text x={SYSTEM.cx} y={SYSTEM.cy + SYSTEM.r + 70} textAnchor="middle">
                SISTEMA
              </text>
            </g>
          </svg>
        </div>

        {/* Tappa in corso. */}
        <div className="grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-10">
          <p className="font-mono text-label text-sky uppercase">
            {current.day} · {leg + 1}/{method.legs.length}
          </p>
          <div key={leg} className="animate-[leg-in_0.6s_cubic-bezier(0.2,0.7,0.1,1)]" aria-live="polite">
            <h3 className="text-[1.125rem] font-medium tracking-[-0.01em] text-white md:text-[1.375rem]">{current.title}</h3>
            <p className="mt-1.5 max-w-[40rem] text-body text-mist/80">
              {current.body} <span className="font-mono text-label text-dust uppercase">· {current.tag}</span>
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {method.legs.map((_, i) => (
              <span key={i} className={`h-1 w-8 rounded-full transition-colors duration-500 ${i <= leg ? 'bg-ember' : 'bg-white/15'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
