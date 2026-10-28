import {useEffect, useRef, type MouseEvent} from 'react';
import {hero, tools} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {clamp, easeOutCubic, lerp, pinProgress, range} from '../lib/math';
import {onFrame, scrollToHash} from '../lib/scroll';

/**
 * L'apertura. Il ritratto è lo sfondo fisso dell'intera pagina (Backdrop);
 * qui sopra si muovono i livelli, ognuno al suo passo:
 *
 *   0.00 – 0.18  un velo di polvere si ritira dall'obiettivo
 *   0.04 – 0.50  l'alone dell'orchestra sale dietro il volto
 *   0.06 – 0.22  il titolo si mette a fuoco (la spaziatura si chiude)
 *   0.18 – 0.50  testo, pulsanti e firma entrano uno dopo l'altro
 *   0.34 – 0.70  le tre card di sistema salgono a velocità diverse
 *   0.72 – 1.00  tutto si inclina verso l'alto e lascia la scena ai servizi
 *
 * Un piccolo HUD di telemetria fa da cornice: orologio, strumenti collegati,
 * coordinate.
 */

const STAGE_VH = 380;

type LayerName = 'sky' | 'orb' | 'grid' | 'f0' | 'f1' | 'f2';
const FLOAT_AT = [
  'right-[4%] top-[24%]',
  'right-[3%] top-[56%]',
  'right-[30%] bottom-[9%]',
];

type Mote = {x: number; y: number; r: number; s: number; a: number};
type Ribbon = {col: [number, number, number]; off: number; amp: number; y: number; wid: number; a: number};

const RIBBONS: Ribbon[] = [
  {col: [255, 138, 61], off: 0, amp: 0.1, y: 0.18, wid: 0.16, a: 0.55},
  {col: [255, 190, 140], off: 1.7, amp: 0.08, y: 0.26, wid: 0.08, a: 0.45},
  {col: [127, 200, 255], off: 3.1, amp: 0.12, y: 0.34, wid: 0.14, a: 0.42},
  {col: [90, 140, 255], off: 4.4, amp: 0.09, y: 0.12, wid: 0.1, a: 0.3},
];

const go = (e: MouseEvent<HTMLAnchorElement>) => {
  const hash = e.currentTarget.getAttribute('href');
  if (!hash) return;
  e.preventDefault();
  scrollToHash(hash);
};

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<Partial<Record<LayerName, HTMLDivElement>>>({});
  const auroraRef = useRef<HTMLCanvasElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLParagraphElement>(null);
  const toolsRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Canvas sizes.
  useEffect(() => {
    const cs = [dustRef.current!, auroraRef.current!];
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      cs.forEach((c) => {
        c.width = Math.round(c.clientWidth * dpr);
        c.height = Math.round(c.clientHeight * dpr);
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    cs.forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const dust = dustRef.current!;
    const dctx = dust.getContext('2d')!;
    const aurora = auroraRef.current!;
    const actx = aurora.getContext('2d')!;
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const motes: Mote[] = Array.from({length: 140}, () => ({x: rand(), y: rand(), r: 0.4 + rand() * 1.6, s: 0.3 + rand(), a: 0.2 + rand() * 0.6}));
    let lastP = -1;
    let lastTime = 0;
    let t = 0;

    const set = (name: LayerName, y: number, scale = 1, opacity = 1) => {
      const el = layerRefs.current[name];
      if (!el) return;
      el.style.transform = `translate3d(0, ${y}vh, 0) scale(${scale})`;
      el.style.opacity = String(opacity);
    };
    const fade = (el: HTMLElement, k: number, rise = 2) => {
      el.style.opacity = String(k);
      el.style.transform = `translate3d(0, ${(1 - k) * rise}vh, 0)`;
      el.style.visibility = k < 0.02 ? 'hidden' : 'visible';
    };

    const drawAurora = (alpha: number) => {
      const w = aurora.clientWidth;
      const h = aurora.clientHeight;
      const dpr = aurora.width / Math.max(1, w);
      actx.setTransform(dpr, 0, 0, dpr, 0, 0);
      actx.clearRect(0, 0, w, h);
      if (alpha < 0.01) return;
      actx.globalCompositeOperation = 'lighter';
      const narrow = w < 900;
      RIBBONS.forEach((r) => {
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const px = (narrow ? 0 : 0.3 * w) + p * (narrow ? w : 0.75 * w);
          // Su schermi stretti il volto occupa la parte alta: i nastri salgono sopra la testa.
          const py = h * (r.y + (narrow ? -0.16 : 0)) + Math.sin(p * 3.2 + t * 0.35 + r.off) * h * r.amp * (narrow ? 0.5 : 1) + p * p * h * (narrow ? 0.04 : 0.18);
          const rad = h * r.wid * (0.6 + 0.4 * Math.sin(p * 5 + t * 0.5 + r.off));
          const f = Math.sin(p * Math.PI);
          const g = actx.createRadialGradient(px, py, 0, px, py, rad);
          g.addColorStop(0, `rgba(${r.col},${0.06 * r.a * f * 2 * alpha * (narrow ? 0.6 : 1)})`);
          g.addColorStop(1, `rgba(${r.col},0)`);
          actx.fillStyle = g;
          actx.beginPath();
          actx.arc(px, py, rad, 0, Math.PI * 2);
          actx.fill();
        }
      });
      actx.globalCompositeOperation = 'source-over';
    };

    return onFrame((time) => {
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const root = rootRef.current;
      if (!root) return;
      const {p, rect} = pinProgress(root);
      if (rect.bottom < 0) return;
      if (!reducedRef.current) t += dt;

      const veil = 1 - range(p, 0, 0.18);
      const exit = range(p, 0.72, 1);

      // L'aurora respira ogni frame finché si vede.
      drawAurora(range(p, 0, 0.3) * (1 - exit));

      // La polvere si muove ogni frame finché il velo è visibile.
      if (veil > 0.001) {
        const w = dust.clientWidth;
        const h = dust.clientHeight;
        const dpr = dust.width / Math.max(1, w);
        dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dctx.clearRect(0, 0, w, h);
        dctx.fillStyle = '#dfe6f2';
        for (const m of motes) {
          if (!reducedRef.current) {
            m.x += 0.006 * m.s * dt;
            m.y -= 0.004 * m.s * dt;
            if (m.x > 1) m.x -= 1;
            if (m.y < 0) m.y += 1;
          }
          dctx.globalAlpha = m.a * veil;
          dctx.beginPath();
          dctx.arc(m.x * w, (m.y - p * 0.6) * h, m.r * (1 + p * 4), 0, Math.PI * 2);
          dctx.fill();
        }
        dctx.globalAlpha = 1;
      }

      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const settle = easeOutCubic(range(p, 0, 0.5));

      // Il velo si ritira verso l'alto.
      veilRef.current!.style.opacity = String(veil);
      veilRef.current!.style.visibility = veil < 0.01 ? 'hidden' : 'visible';
      veilRef.current!.style.transform = `translate3d(0, ${-range(p, 0, 0.18) * 24}vh, 0) scale(${1 + range(p, 0, 0.18) * 0.25})`;
      dust.style.opacity = String(veil);

      // Dal più lontano al più vicino, ognuno più veloce del precedente.
      set('sky', lerp(0, -6, p), lerp(1.14, 1, settle), 1);
      const rise = easeOutCubic(range(p, 0.04, 0.5));
      set('orb', lerp(34, 0, rise) - exit * 12, lerp(0.9, 1, rise), rise * (1 - exit));
      set('grid', lerp(14, 0, settle) - exit * 26, 1, range(p, 0, 0.3) * (1 - exit));
      for (let i = 0; i < 3; i++) {
        const up = easeOutCubic(range(p, 0.34 + i * 0.05, 0.62 + i * 0.05));
        set(`f${i}` as LayerName, lerp(24, 0, up) - exit * (40 + i * 14), 1, clamp(up * 2) * (1 - exit));
      }

      // Titolo: si mette a fuoco (la spaziatura si chiude), poi cede la scena.
      const tIn = easeOutCubic(range(p, 0.06, 0.22));
      const title = titleRef.current!;
      title.style.opacity = String(tIn);
      title.style.letterSpacing = `${lerp(0.5, 0.16, tIn)}em`;
      title.style.filter = tIn < 0.99 ? `blur(${(1 - tIn) * 10}px)` : '';
      fade(leadRef.current!, easeOutCubic(range(p, 0.18, 0.32)));
      fade(ctaRef.current!, easeOutCubic(range(p, 0.28, 0.42)));
      fade(sigRef.current!, easeOutCubic(range(p, 0.36, 0.5)));
      const block = blockRef.current!;
      block.style.opacity = String(clamp(1 - exit * 1.3));
      block.style.transform = `translate3d(0, ${-p * 4 - exit * 40}vh, 0)`;
      block.style.pointerEvents = exit > 0.6 ? 'none' : '';

      // Telemetria.
      hudRef.current!.style.opacity = String(range(p, 0.02, 0.1) * (1 - range(p, 0.62, 0.72)));
      const secs = p * 5400;
      clockRef.current!.textContent = `T+ ${String(Math.floor(secs / 3600)).padStart(2, '0')}:${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
      toolsRef.current!.textContent = `${Math.round(rise * 10)}/10`;
    });
  }, []);

  const layer = (name: LayerName, className: string, children: React.ReactNode) => (
    <div
      ref={(el) => {
        if (el) layerRefs.current[name] = el;
      }}
      className={`pointer-events-none absolute will-change-transform ${className}`}
      style={{opacity: 0}}
    >
      {children}
    </div>
  );

  return (
    <section id="top" ref={rootRef} aria-label="Apertura" className="relative" style={{height: `${STAGE_VH}svh`}}>
      <div className="sticky top-0 h-screen-s overflow-hidden">
        {/* Cielo: nastri di luce arancio e azzurra. */}
        {layer('sky', 'inset-0', <canvas ref={auroraRef} aria-hidden="true" className="size-full" />)}

        {/* Alone dell'orchestra, dietro il volto. */}
        {layer(
          'orb',
          'top-[4%] left-1/2 size-[min(120vw,90vh)] -translate-x-1/2 -translate-y-1/2 mix-blend-screen md:top-[30%] md:left-[63%] md:size-[min(70vw,100vh)]',
          <div className="size-full rounded-full max-md:opacity-45 bg-[radial-gradient(circle_at_50%_50%,rgba(255,138,61,0.28),rgba(127,200,255,0.12)_42%,transparent_68%)]" />,
        )}

        {/* Pavimento a griglia, in prospettiva. */}
        {layer(
          'grid',
          'inset-x-0 bottom-0 h-[42vh] [mask-image:linear-gradient(to_top,#000_10%,transparent)]',
          <div className="size-full [perspective:520px]">
            <div className="size-full origin-bottom [background:repeating-linear-gradient(to_right,rgba(127,200,255,0.18)_0_1px,transparent_1px_64px),repeating-linear-gradient(to_bottom,rgba(127,200,255,0.18)_0_1px,transparent_1px_48px)] [transform:rotateX(62deg)_scale(1.6)]" />
          </div>,
        )}

        {/* Titolo e testo. */}
        <div className="pointer-events-none absolute inset-0 flex items-end px-4 pt-24 pb-16 sm:px-6 md:items-center md:px-[6vw] md:pb-0">
          <div ref={blockRef} className="w-full max-w-[34rem] will-change-transform md:max-w-[46rem]">
            <p className="font-mono text-label text-sky uppercase">{hero.kicker}</p>
            <h1 ref={titleRef} className="mt-4 text-hero font-semibold text-white [text-shadow:0_4px_40px_rgb(0_0_0/0.5)]" style={{opacity: 0, letterSpacing: '0.5em'}}>
              <span className="sr-only">AI Orchestrator</span>
              <span aria-hidden="true">
                {hero.title[0]}
                <br />
                {hero.title[1]}
              </span>
            </h1>
            <div ref={leadRef} className="mt-6" style={{opacity: 0}}>
              <p className="text-lead font-medium text-white">
                <span className="text-white/55">{hero.lead[0]}</span>
                <br />
                {hero.lead[1]}
              </p>
              <p className="mt-4 max-w-[30rem] text-body text-mist/80">{hero.body}</p>
            </div>
            <div ref={ctaRef} className="pointer-events-auto mt-7 flex flex-wrap items-center gap-3" style={{opacity: 0}}>
              <a className="btn primary" href="#contatti" data-tab="appuntamento" onClick={go}>
                {hero.cta}
              </a>
              <a className="btn ghost" href="#metodo" onClick={go}>
                {hero.cta2} →
              </a>
            </div>
            <div ref={sigRef} className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 max-md:hidden" style={{opacity: 0}}>
              {hero.sig.map((s) => (
                <div key={s.t}>
                  <strong className="block text-[0.9375rem] font-medium text-white">{s.t}</strong>
                  <small className="text-[0.8125rem] text-dust">{s.s}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card di sistema, sul lato del ritratto. */}
        {hero.floats.map((f, i) =>
          layer(
            `f${i}` as LayerName,
            `${FLOAT_AT[i]} max-lg:hidden`,
            <div className="animate-bob flex items-center gap-2.5 rounded-[14px] border border-white/10 bg-void-2/70 py-2.5 pr-4 pl-3 text-[0.8125rem] leading-snug whitespace-nowrap text-white shadow-[0_14px_44px_rgb(0_0_0/0.45)] backdrop-blur-md" style={{animationDelay: `${-i * 2.3}s`}}>
              <span className="size-2 shrink-0 rounded-full bg-[#6ee7a8] [animation:ping_2.4s_ease-out_infinite]" />
              <span>
                {f.title}
                <small className="block font-mono text-[0.7rem] tracking-[0.03em] text-dust">{f.meta}</small>
              </span>
            </div>,
          ),
        )}

        {/* Velo di polvere sull'obiettivo. */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 30% 40%, rgba(170,184,210,0.55), transparent 70%), radial-gradient(50% 60% at 75% 60%, rgba(120,140,180,0.5), transparent 70%), radial-gradient(80% 80% at 50% 50%, rgba(20,26,40,0.85), rgba(11,11,13,0.95))',
          }}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <p className="font-mono text-label text-mist/80 uppercase">{hero.kicker}</p>
            <p className="mt-3 text-[0.8125rem] font-medium tracking-[0.5em] text-white/90 uppercase" style={{marginRight: '-0.5em'}}>
              Scorri per aprire
            </p>
            <span aria-hidden="true" className="mt-6 inline-block animate-bounce text-mist/70 motion-reduce:animate-none">
              ↓
            </span>
          </div>
        </div>
        <canvas ref={dustRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />

        {/* HUD di telemetria. */}
        <div ref={hudRef} aria-hidden="true" className="pointer-events-none absolute inset-4 font-mono text-[0.625rem] tracking-[0.14em] text-mist/75 uppercase sm:inset-6 md:text-label" style={{opacity: 0}}>
          <div className="brackets absolute inset-0 text-mist/40" />
          <div className="absolute top-16 left-3 space-y-1 md:top-20 md:left-4">
            <p ref={clockRef}>T+ 00:00:00</p>
            <p className="text-mist/50">Sistema attivo</p>
          </div>
          <div className="absolute top-16 right-3 space-y-1 text-right md:top-20 md:right-4">
            <p>
              Strumenti <span ref={toolsRef} className="text-sky">0/10</span>
            </p>
            <p className="text-mist/50">Collegati</p>
          </div>
          <div className="absolute bottom-3 left-3 max-sm:hidden md:bottom-4 md:left-4">{hero.site}</div>
          <div className="absolute right-3 bottom-3 flex items-center gap-2 md:right-4 md:bottom-4">
            Scorri <span className="inline-block animate-bounce motion-reduce:animate-none">↓</span>
          </div>
        </div>
      </div>

      {/* Striscia degli strumenti, appena sotto l'apertura. */}
      <div className="sr-only">
        <p>Strumenti che collego: {tools.join(', ')}.</p>
      </div>
    </section>
  );
}
