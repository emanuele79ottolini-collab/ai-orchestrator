import {about} from '../content';
import {useReveals} from '../hooks/useReveals';

/**
 * Chi sono. Qui il ritratto torna in primo piano: lo sfondo fisso si
 * rischiara mentre la sezione attraversa lo schermo, e il testo resta sul
 * lato sinistro, in un pannello di vetro.
 */
export function About() {
  const ref = useReveals<HTMLElement>();
  return (
    <section ref={ref} id="chi" aria-labelledby="chi-title" className="relative flex min-h-[110svh] items-center px-4 py-24 sm:px-6 md:px-[6vw]">
      <div data-reveal className="max-w-[34rem] rounded-[22px] border border-white/10 bg-void/55 p-6 backdrop-blur-md sm:p-9 max-md:mt-[42svh]">
        <p className="font-mono text-label text-ember uppercase">{about.eyebrow}</p>
        <h2 id="chi-title" className="mt-4 text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.2] font-medium tracking-[-0.025em] text-white">
          {about.quote}
        </h2>
        <p className="mt-5 text-[1.0625rem] text-mist/85">{about.p1}</p>
        <p className="mt-4 text-[1.0625rem] text-mist/85">{about.p2}</p>
      </div>
    </section>
  );
}
