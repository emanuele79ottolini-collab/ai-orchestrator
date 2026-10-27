import {useEffect, useRef} from 'react';
import {services, tools} from '../content';
import {clamp, pinProgress, range} from '../lib/math';
import {onFrame} from '../lib/scroll';

/**
 * I servizi, come un rullo di fotogrammi. La sezione si blocca e il rullo
 * scorre di lato con lo scroll; la scheda più vicina al centro è a fuoco, le
 * altre sfumano, e ogni illustrazione scivola nella sua cornice.
 */

const SECTION_VH = 340;
const TINTS = ['255,138,61', '127,200,255', '255,190,140', '90,140,255'];

/** Una foto per servizio, in ordine: analisi, agenti, automazioni, persone. */
const PHOTOS = ['servizio-analisi', 'servizio-agenti', 'servizio-automazioni', 'servizio-persone'];

export function Services() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<HTMLLIElement[]>([]);
  const visRefs = useRef<HTMLDivElement[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let lastP = -1;
    return onFrame(() => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const vw = window.innerWidth;
      const k = range(p, 0.04, 0.96);
      // offsetLeft è la posizione di layout senza trasformazioni, quindi resta
      // stabile mentre il rullo viene traslato.
      const travel = Math.max(0, track.offsetLeft + track.scrollWidth - vw * 0.94);
      track.style.transform = `translate3d(${-k * travel}px, 0, 0)`;

      let nearest = 0;
      let best = Infinity;
      cardRefs.current.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const off = (r.left + r.width / 2 - vw * 0.62) / vw; // linea di fuoco a destra del centro
        const a = clamp(Math.abs(off) * 1.6);
        card.style.opacity = String(1 - a * 0.55);
        card.style.transform = `scale(${1 - a * 0.07})`;
        visRefs.current[i].style.transform = `translate3d(${off * -60}px, 0, 0) scale(1.15)`;
        if (Math.abs(off) < best) {
          best = Math.abs(off);
          nearest = i;
        }
      });
      barRef.current!.style.transform = `scaleX(${k})`;
      countRef.current!.textContent = `0${nearest + 1}`;
    });
  }, []);

  const loop = [...tools, ...tools];

  return (
    <>
      <div className="marquee" aria-label="Strumenti che collego">
        <div className="track" aria-hidden="true">
          {loop.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      <section ref={rootRef} id="servizi" aria-labelledby="servizi-title" className="relative" style={{height: `${SECTION_VH}svh`}}>
        <div className="sticky top-0 flex h-screen-s flex-col justify-center overflow-hidden pt-16 md:flex-row md:items-center md:justify-start md:pt-0">
          <div className="relative z-10 shrink-0 px-4 sm:px-6 md:w-[34vw] md:pl-[6vw] md:pr-10">
            <p className="font-mono text-label text-ember uppercase">{services.eyebrow}</p>
            <h2 id="servizi-title" className="mt-4 text-display font-semibold text-white">
              {services.heading}
            </h2>
            <p className="mt-5 max-w-[27rem] text-body text-mist/75 max-md:hidden">{services.body}</p>
            <div className="mt-8 flex items-center gap-4 font-mono text-label text-mist/70 uppercase max-md:hidden" aria-hidden="true">
              <span>
                <span ref={countRef} className="text-white">
                  01
                </span>{' '}
                / 0{services.items.length}
              </span>
              <span className="relative h-px w-32 bg-white/15">
                <span ref={barRef} className="absolute inset-0 origin-left bg-ember" style={{transform: 'scaleX(0)'}} />
              </span>
            </div>
          </div>

          <ol ref={trackRef} className="mt-8 flex gap-5 pl-4 will-change-transform sm:pl-6 md:mt-0 md:gap-7 md:pl-0">
            {services.items.map((s, i) => (
              <li
                key={s.title}
                ref={(el) => {
                  if (el) cardRefs.current[i] = el;
                }}
                className="w-[74vw] shrink-0 origin-bottom sm:w-[46vw] md:w-[clamp(16rem,24vw,23rem)]"
              >
                <article>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-void-2/80 ring-1 ring-white/10 backdrop-blur-sm max-md:aspect-[5/4]">
                    <div
                      ref={(el) => {
                        if (el) visRefs.current[i] = el;
                      }}
                      className="absolute inset-0 will-change-transform"
                    >
                      <img src={`${import.meta.env.BASE_URL}images/${PHOTOS[i]}.jpg`} alt="" width={900} height={1100} decoding="async" className="size-full object-cover" />
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{background: `linear-gradient(to bottom, rgba(11,11,13,0.35), rgba(11,11,13,0) 30%, rgba(11,11,13,0.2) 55%, rgba(11,11,13,0.88)), radial-gradient(80% 60% at 50% 40%, rgba(${TINTS[i]},0.14), transparent 75%)`}}
                    />
                    <span className="absolute top-3 left-3 rounded-[3px] bg-void/70 px-2 py-1 font-mono text-[0.625rem] tracking-[0.14em] text-white uppercase backdrop-blur">{s.tag}</span>
                    <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                      {s.chips.map((c) => (
                        <span key={c} className="rounded-full border border-white/15 bg-void/60 px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.04em] text-mist/85 backdrop-blur">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <span className="font-mono text-label text-ember">0{i + 1}</span>
                    <div>
                      <h3 className="text-[1.0625rem] font-medium tracking-[-0.01em] text-white">{s.title}</h3>
                      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-mist/75">{s.body}</p>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
