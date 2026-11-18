import { APPS, host } from './apps';
import { HeroArt, InkDefs, PageArt } from './Art';

export const App = () => (
  <>
    <InkDefs />
    <main id="main">
      <div className="stage">
        <HeroArt />
        <header className="hero wrap">
          <div className="hero-text">
            <p className="eyebrow">Tabletop RPG tools</p>
            <h1 className="wordmark">dice-jar</h1>
            <p className="lede">Character creators and party trackers for tabletop roleplaying games. Many worlds, one shelf.</p>
          </div>
          <img
            className="hero-mark"
            src="/logo-560.webp"
            srcSet="/logo-560.webp 560w, /logo-1120.webp 1120w"
            sizes="(min-width: 60rem) 28rem, 80vw"
            width="560"
            height="560"
            alt=""
          />
        </header>
      </div>

      <div className="lower">
        <PageArt />
        <section className="wrap" aria-labelledby="apps-heading">
          <h2 id="apps-heading" className="eyebrow">
            The apps
          </h2>
          <ul className="cards">
            {APPS.map((app) => (
              <li key={app.name} className={`card ${app.look ?? 'soon'}`}>
                <p className="eyebrow">{app.game}</p>
                <h3>{app.url ? <a href={app.url}>{app.name}</a> : app.name}</h3>
                <p>{app.blurb}</p>
                <p className="card-meta">{app.url ? host(app.url) : 'Coming soon'}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about wrap" aria-labelledby="about-heading">
          <h2 id="about-heading" className="eyebrow">
            About
          </h2>
          <p>
            Each app is made for one game, follows that game&apos;s own rules, and lives at its own address. They share their code in one{' '}
            <a href="https://github.com/gvorbeck/dice-jar">open-source repository</a>.
          </p>
        </section>
      </div>
    </main>
    <footer className="footer wrap">
      <span>
        &copy; {new Date().getFullYear()} <a href="https://iamgarrett.com">J. Garrett Vorbeck</a>
      </span>
      <a href="https://github.com/gvorbeck/dice-jar">GitHub</a>
    </footer>
  </>
);
