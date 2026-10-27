import {useEffect, useRef} from 'react';
import {clamp, pinProgress, range} from '../lib/math';
import {onFrame} from '../lib/scroll';

/**
 * Il ritratto resta fermo dietro tutta la pagina. Quanto si vede lo decide lo
 * scroll: pieno nell'hero, in sordina dietro i testi, di nuovo in primo piano
 * quando si arriva a "Chi sono".
 */

const BASE = 0.2;

export function Backdrop() {
  const imgRef = useRef<HTMLImageElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = -1;
    return onFrame(() => {
      const hero = document.getElementById('top');
      const about = document.getElementById('chi');
      let level = BASE;
      if (hero) level = Math.max(level, 1 - range(pinProgress(hero).p, 0.62, 0.95) * (1 - BASE));
      if (about) {
        const r = about.getBoundingClientRect();
        const c = (r.top + r.height / 2) / window.innerHeight;
        level = Math.max(level, 0.78 * (1 - clamp(Math.abs(c - 0.5) * 1.5)));
      }
      const y = window.scrollY;
      const key = Math.round(level * 1000) + y * 0.01;
      if (Math.abs(key - last) < 0.01) return;
      last = key;
      dimRef.current!.style.opacity = String(1 - level);
      imgRef.current!.style.transform = `translate3d(0, ${-Math.min(y, 6000) * 0.015}px, 0) scale(1.06)`;
    });
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void">
      <div className="absolute inset-y-0 right-0 w-full md:w-[66%] md:[mask-image:linear-gradient(to_right,transparent,#000_38%)]">
        <img
          ref={imgRef}
          src="/images/emanuele.jpg"
          alt=""
          width={1400}
          height={1400}
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-[42%_0%] will-change-transform md:object-[50%_18%]"
        />
      </div>
      {/* Legge i testi a sinistra e in basso senza spegnere il volto. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.92),transparent_55%)] md:bg-[linear-gradient(to_right,rgb(11_11_13/0.7),transparent_50%)]" />
      <div ref={dimRef} className="absolute inset-0 bg-void" style={{opacity: 1}} />
    </div>
  );
}
