import { CatalogueSearch } from "@/components/catalogue-search";

const journey = [
  ["01", "Find your fit", "Search by vehicle or tyre size without needing to understand tyre codes."],
  ["02", "Compare with confidence", "See brand, category, warranty, availability and total fitting cost together."],
  ["03", "Book an approved station", "Choose a convenient fitting station and an appointment slot that works."],
];

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="TyreLink Ghana home">
          <span className="brand-mark">T</span>
          <span>TyreLink<span className="brand-accent">GH</span></span>
        </a>
        <a className="admin-link" href="#operations">Partner access</a>
      </nav>

      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow">Ghana&apos;s smarter tyre marketplace</div>
        <h1 id="hero-title">The right tyre.<br /><em>Fitted properly.</em></h1>
        <p className="hero-copy">Compare compatible tyres, choose an approved fitting station and book with confidence.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#start">Find your tyres <span>→</span></a>
          <a className="button button-secondary" href="#how-it-works">How it works</a>
        </div>
        <div className="trust-row" aria-label="TyreLink service benefits">
          <span>✓ Compatible options</span><span>✓ Approved stations</span><span>✓ GHS pricing</span>
        </div>
      </section>

      <section className="journey" id="how-it-works" aria-labelledby="journey-title">
        <div className="section-kicker">Simple by design</div>
        <h2 id="journey-title">From search to fitting in three clear steps.</h2>
        <div className="journey-grid">
          {journey.map(([number, title, copy]) => (
            <article className="journey-card" key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="start-panel" id="start" aria-labelledby="start-title">
        <div>
          <div className="section-kicker">Start with what you know</div>
          <h2 id="start-title">Search by vehicle or tyre size.</h2>
          <p>We will guide you from the information on your vehicle to a suitable fitting option.</p>
        </div>
        <CatalogueSearch />
      </section>

      <section className="operations" id="operations" aria-labelledby="operations-title">
        <div className="section-kicker">Built for the real operation</div>
        <h2 id="operations-title">One marketplace. Clear roles.</h2>
        <div className="role-row"><span>Customer</span><span>Station</span><span>Fitter</span><span>Admin</span></div>
      </section>

      <footer><span>TyreLink Ghana</span><span>Webara Studio venture</span></footer>
    </main>
  );
}
