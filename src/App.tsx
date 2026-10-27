import {useEffect} from 'react';
import {About} from './components/About';
import {Backdrop} from './components/Backdrop';
import {Footer, Header} from './components/Chrome';
import {Contact} from './components/Contact';
import {Flow} from './components/Flow';
import {Hero} from './components/Hero';
import {Method} from './components/Method';
import {Services} from './components/Services';
import {useReducedMotion} from './hooks/useReducedMotion';
import {startScroll} from './lib/scroll';

export default function App() {
  const reduced = useReducedMotion();
  useEffect(() => startScroll(reduced), [reduced]);

  return (
    <>
      <a className="skip" href="#main">
        Vai al contenuto
      </a>
      <Backdrop />
      <Header />
      <main id="main" className="relative z-10">
        <Hero />
        <Services />
        <Flow />
        <Method />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
