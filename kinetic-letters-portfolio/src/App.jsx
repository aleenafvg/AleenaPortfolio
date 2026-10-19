import { useEffect, useState } from 'react';
import LetterField from './LetterField.jsx';

const projects = [
  { n: '01', tag: 'AI / COMPUTER VISION', title: 'Seeing beyond\nthe pixels', year: '2026', color: 'lime' },
  { n: '02', tag: 'FULL-STACK / PRODUCT', title: 'Useful things,\nbeautifully built', year: '2026', color: 'lavender' },
  { n: '03', tag: 'EXPERIMENT / INTERACTION', title: 'Play is a\nserious tool', year: '2025', color: 'coral' },
];

export default function App() {
  const [scroll, setScroll] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScroll(Math.min(100, Math.round((window.scrollY / max) * 100)));
      setShowTop(window.scrollY > window.innerHeight * 0.7);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <>
      <LetterField />
      <div className="ambient" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Back to top">
          <span className="brand-mark">U<span>.</span></span>
          <span className="brand-name">INDEPENDENT DEVELOPER<br />DELHI, INDIA</span>
        </a>
        <a className="availability" href="mailto:hello@example.com">
          <span className="status-dot" /> AVAILABLE FOR SELECT PROJECTS
        </a>
        <a className="menu-link" href="#contact">LET’S TALK <span>↗</span></a>
      </header>

      <main>
        <section className="hero section-shell" id="top">
          <div className="hero-meta"><span>PORTFOLIO / 2026</span><span>SCROLL TO DISTURB THE PEACE ↓</span></div>
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> CODE MEETS CURIOSITY</p>
            <h1>Ideas in<br /><em>motion.</em></h1>
            <p className="hero-subtitle">I’m a developer who turns complex problems into thoughtful digital experiences — with a little room for play.</p>
          </div>
          <div className="hero-bottom">
            <div className="scroll-hint"><span className="scroll-line" /><span>KEEP SCROLLING<br />LET THE LETTERS GO</span></div>
            <span className="hero-index">01 / 04</span>
          </div>
          <div className="hero-note">A SMALL STUDY IN<br />MOTION & MATTER</div>
        </section>

        <section className="manifesto section-shell" id="about">
          <div className="section-kicker"><span>01 — THE APPROACH</span><span>CURIOUS BY DEFAULT</span></div>
          <div className="manifesto-grid">
            <h2>Built with logic.<br /><span>Made to feel.</span></h2>
            <div className="manifesto-copy">
              <p>I work at the intersection of engineering and experience. From AI prototypes to useful products, I care about the invisible decisions that make something feel effortless.</p>
              <p className="muted-copy">The details matter. The unexpected moments matter more.</p>
              <a className="text-link" href="#work">EXPLORE SELECTED WORK <span>↓</span></a>
            </div>
          </div>
        </section>

        <section className="work section-shell" id="work">
          <div className="section-kicker"><span>02 — SELECTED WORK</span><span>A FEW THINGS MADE WITH INTENT</span></div>
          <div className="work-heading"><h2>From thought<br />to <em>thing.</em></h2><span className="work-side-note">A MIX OF SYSTEMS,<br />TOOLS & EXPERIMENTS.</span></div>
          <div className="project-list">
            {projects.map((project) => (
              <a className={`project-row ${project.color}`} href="#contact" key={project.n}>
                <span className="project-number">{project.n}</span>
                <span className="project-main"><span className="project-tag">{project.tag}</span><span className="project-title">{project.title.split('\n').map((part) => <span key={part}>{part}</span>)}</span></span>
                <span className="project-year">{project.year}</span><span className="project-arrow">↗</span>
              </a>
            ))}
          </div>
          <p className="projects-disclaimer">SAMPLE PROJECT TITLES — REPLACE THESE WITH YOUR REAL PROJECTS.</p>
        </section>

        <section className="contact section-shell" id="contact">
          <div className="section-kicker"><span>03 — THE NEXT THING</span><span>YOUR IDEA, PERHAPS?</span></div>
          <p className="eyebrow"><span className="eyebrow-line" /> HAVE SOMETHING IN MIND?</p>
          <h2>Let’s make<br />it <em>move.</em></h2>
          <a className="contact-link" href="mailto:hello@example.com">HELLO@EXAMPLE.COM <span>↗</span></a>
          <footer className="footer"><span>© 2026 — YOUR NAME</span><span>DESIGNED TO KEEP MOVING</span><a href="#top">BACK TO TOP ↑</a></footer>
        </section>
      </main>

      <div className="scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${scroll / 100})` }} /></div>
      {showTop && <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">↑</button>}
      <div className="field-caption" aria-hidden="true"><span>GLYPH STUDY / 001</span><span>SCROLL {String(scroll).padStart(2, '0')}%</span></div>
    </>
  );
}
