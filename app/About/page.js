// app/About/page.js
"use client";

import Header from "../Header/Header";


export default function AboutPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="hero">
        <div className="wrap">
          <div className="titles">
            <span className="badge">About</span>
            <h1>Chill Team</h1>
            <p className="lead">
              We’re a small group obsessed with turning satellite data into practical tools for
              planners. For the 2025 NASA Space Apps Challenge, we built{" "}
              <b>CityPulse</b>: data pathways to healthier, more equitable cities.
            </p>
          </div>

          {/* Minimal logo-ish globe */}
          <div className="viz">
            <div className="globe">
              <svg viewBox="0 0 160 160" width="100%" height="100%" aria-hidden>
                <defs>
                  <radialGradient id="bg" cx="50%" cy="35%" r="80%">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </radialGradient>
                </defs>
                <circle cx="80" cy="80" r="70" fill="url(#bg)" />
                <g stroke="#0c4a6e" strokeWidth="2" fill="none" opacity=".85">
                  <ellipse cx="80" cy="80" rx="65" ry="22" />
                  <ellipse cx="80" cy="60" rx="65" ry="22" />
                  <ellipse cx="80" cy="100" rx="65" ry="22" />
                  <path d="M80 10v140M10 80h140" />
                </g>
              </svg>
            </div>
            <div className="small note">Chill Team · NASA Space Apps ’25</div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <h2 className="h2">Team</h2>
          <div className="grid">
            <Member name="Andre Acero"    role="Data & Frontend" />
            <Member name="Jose Luis Chacon" role="UX & UI" />
            <Member name="Cesar Aguirre"  role="QA" />
            <Member name="Jose Melesio"   role="Backend & Integrations" />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section light">
        <div className="container">
          <h2 className="h2">Mission</h2>
          <p className="body">
            Use NASA Earth observation data to help planners answer three questions fast:
            <b> Where is heat risk highest?</b> <b>Who lacks access to greenspace?</b> and
            <b> where should growth and services go</b> to protect people and ecosystems.
          </p>

          <div className="cards">
            <div className="card">
              <h3>Datasets We Love</h3>
              <ul>
                <li>NASA GIBS (MODIS NDVI, base layers)</li>
                <li>Copernicus Sentinel-2 (10 m NDVI)</li>
                <li>WorldPop / SEDAC (population & equity)</li>
                <li>OSM / city open data (parks, roads)</li>
              </ul>
            </div>
            <div className="card">
              <h3>What We Built</h3>
              <ul>
                <li>Leaflet/MapLibre map with NASA tiles</li>
                <li>Greengap index & priority sites</li>
                <li>Planner-friendly panels and exports</li>
              </ul>
            </div>
            <div className="card">
              <h3>Why “Chill”?</h3>
              <p className="body">
                Because cooler streets, more trees, and calmer planning decisions make cities
                better for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Thanks */}
      <section className="section">
        <div className="container">
          <h2 className="h2">Acknowledgements</h2>
          <p className="body">
            Thanks to NASA Space Apps organizers and the open-data community. Special shout-out to
            the teams behind GIBS, Sentinel-2, WorldPop, SEDAC, and OpenStreetMap.
          </p>

         
        </div>
      </section>

      <style jsx>{`
        :global(*) { box-sizing: border-box }
        .hero {
          background:
            radial-gradient(1200px 400px at 50% -80px, rgba(56,189,248,.25), transparent 60%),
            linear-gradient(180deg, #020617, #071827 40%, #0b1722 100%);
          color: #e6f6ff;
          border-bottom: 1px solid rgba(148,163,184,.2);
        }
        .wrap {
          max-width: 1100px; margin: 0 auto; padding: 40px 16px 28px;
          display: grid; gap: 22px; grid-template-columns: 1.2fr .8fr; align-items: center;
        }
        .badge {
          display: inline-block; padding: 4px 10px; border-radius: 999px;
          background: #0ea5e980; color: #04283b; font-size: 12px; font-weight: 800;
          border: 1px solid #7dd3fc;
        }
        h1 { margin: 10px 0 8px; font-size: 40px; line-height: 1.1; letter-spacing: .2px }
        .lead { margin: 0; opacity: .95; max-width: 60ch }
        .viz .globe { width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden }
        .small.note { color: #a6e0ff; opacity: .85; margin-top: 8px; text-align: center }

        .section { padding: 48px 0 }
        .section.light { background: #f8fafc; border-top: 1px solid #e2e8f0 }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 16px }
        .h2 { font-size: 28px; margin: 0 0 12px }
        .body { color: #334155; max-width: 80ch }

        .grid {
          display: grid; gap: 14px; grid-template-columns: 1fr; 
        }
        @media (min-width: 820px) { .grid { grid-template-columns: repeat(4, 1fr) } }

        .member {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px;
          box-shadow: 0 6px 22px rgba(15,23,42,.05);
          display: grid; gap: 6px;
        }
        .member .name { font-weight: 800; }
        .member .role { font-size: 13px; color: #475569 }

        .cards {
          display: grid; gap: 14px; grid-template-columns: 1fr;
        }
        @media (min-width: 900px) { .cards { grid-template-columns: repeat(3, 1fr) } }

        .card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;
          box-shadow: 0 6px 22px rgba(15,23,42,.05);
        }

        .contact { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap }
        .btn {
          text-decoration: none; display: inline-block; padding: 10px 14px; border-radius: 12px;
          font-weight: 800; font-size: 14px; border: 1px solid transparent; color: #031224;
          box-shadow: 0 8px 26px rgba(14,165,233,.25);
        }
        .btn.sky { background: linear-gradient(90deg, #38bdf8, #0ea5e9) }
        .btn.emerald { background: linear-gradient(90deg, #34d399, #10b981) }

        @media (max-width: 900px) {
          .wrap { grid-template-columns: 1fr; }
          h1 { font-size: 34px }
        }
      `}</style>
    </>
  );
}

/* ------ Small component for team member ------ */
function Member({ name, role }) {
  return (
    <div className="member">
      <div className="name">{name}</div>
      <div className="role">{role}</div>
    </div>
  );
}
