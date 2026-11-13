import {useEffect, useRef, useState, type MouseEvent} from 'react';
import {brand, nav} from '../content';
import {onFrame, scrollToHash} from '../lib/scroll';

function go(e: MouseEvent<HTMLAnchorElement>, then?: () => void) {
  const hash = e.currentTarget.getAttribute('href');
  if (!hash?.startsWith('#')) return;
  e.preventDefault();
  then?.();
  scrollToHash(hash);
}

/** Barra di avanzamento in cima alla pagina. */
function Progress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      onFrame(() => {
        const m = document.documentElement.scrollHeight - window.innerHeight;
        ref.current!.style.transform = `scaleX(${m > 0 ? Math.min(1, window.scrollY / m) : 0})`;
      }),
    [],
  );
  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left bg-[linear-gradient(90deg,var(--color-ember),var(--color-sky))]" style={{transform: 'scaleX(0)'}} />;
}

/** Monogramma "AI" in un quadrato arancione con un punto azzurro; stesso disegno della favicon. */
function Logo({className}: {className?: string}) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" className={className}>
      <rect x="3" y="3" width="34" height="34" rx="9" fill="none" stroke="#ff8a3d" strokeWidth="2.4" />
      <text x="20" y="25.5" textAnchor="middle" fontFamily="Geist Mono, ui-monospace, monospace" fontSize="16" fontWeight="500" fill="#f4f4f2">
        AI
      </text>
      <circle cx="33" cy="7" r="3.4" fill="#7fc8ff" />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  // Menu aperto: la pagina sotto resta ferma, Esc chiude.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 text-white">
      <Progress />
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5 md:px-[4vw]">
        <a href="#top" onClick={(e) => go(e)} className="-my-2 flex items-center gap-3 py-2" aria-label={`${brand.name} — torna in cima`}>
          <Logo className="size-9 shrink-0 md:size-11" />
          <span className="text-[1.3125rem] leading-none font-semibold tracking-[-0.02em] md:text-[1.75rem]">{brand.name}</span>
        </a>
        <nav aria-label="Principale" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => go(e)} className="font-mono text-label text-white/75 uppercase transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
          <a href="#contatti" data-tab="appuntamento" onClick={(e) => go(e)} className="rounded-full bg-white px-4 py-2.5 font-mono text-label text-void uppercase transition-colors hover:bg-sky">
            Prenota una call
          </a>
        </nav>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="menu" className="-my-3 -mr-3 px-3 py-3.5 font-mono text-label uppercase md:hidden">
          {open ? 'Chiudi' : 'Menu'}
        </button>
      </div>
      <div id="menu" inert={!open} className={`fixed inset-0 -z-10 flex flex-col justify-center gap-6 bg-void/95 px-6 backdrop-blur-xl transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {nav.map((item, i) => (
          <a key={item.href} href={item.href} onClick={(e) => go(e, () => setOpen(false))} className="flex items-baseline gap-4 text-[1.75rem] font-medium tracking-[-0.02em]">
            <span className="font-mono text-label text-sky">0{i + 1}</span>
            {item.label}
          </a>
        ))}
        <a href="#contatti" data-tab="appuntamento" onClick={(e) => go(e, () => setOpen(false))} className="mt-4 self-start rounded-full bg-white px-5 py-3 font-mono text-label text-void uppercase">
          Prenota una call
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-void px-4 py-8 sm:px-6 md:px-[6vw]">
      <div className="flex flex-col gap-3 font-mono text-label text-dust uppercase md:flex-row md:items-center md:justify-between">
        <span>
          © {new Date().getFullYear()} {brand.name} · {brand.tagline}
        </span>
        <span>
          <a href={import.meta.env.BASE_URL + 'privacy.html'} className="-my-2.5 inline-block py-2.5 text-[#b8b8be] hover:text-white">
            Privacy
          </a>{' '}
          ·{' '}
          <a href={import.meta.env.BASE_URL + 'cookie.html'} className="-my-2.5 inline-block py-2.5 text-[#b8b8be] hover:text-white">
            Cookie
          </a>
        </span>
      </div>
    </footer>
  );
}
