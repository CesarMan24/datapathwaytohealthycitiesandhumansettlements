// app/page.js
"use client";

import Link from "next/link";
import Header from "./Header/Header";

export default function Home() {
  return (
    <>
      <Header />

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="copy">
            <span className="badge">2025 NASA Space Apps</span>
            <h1>Data Pathways to Healthy Cities &amp; Human Settlements</h1>
            <p className="lead">
              A planner-friendly toolkit that uses NASA Earth observation data to target{" "}
              <b>heat risk</b>, improve <b>greenspace equity</b>, and guide{" "}
              <b>smart growth</b>—turning satellite insights into concrete actions.
            </p>

            <div className="ctaRow">
              <Link href="/Calor" className="btn primary">Explore Heat</Link>
              <Link href="/Greengap" className="btn sky">Greenspace</Link>
              <Link href="/Hospitales" className="btn emerald">Healthcare</Link>
            </div>

            <div className="badges">
              <span className="chip">ECOSTRESS / MODIS LST</span>
              <span className="chip">Sentinel-2 NDVI</span>
              <span className="chip">WorldPop / SEDAC</span>
              <span className="chip">VIIRS Night Lights</span>
            </div>
          </div>

          {/* Decorative globe card */}
          <div className="viz">
            <div className="card">
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
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container">
          <h2 className="h2">What CityPulse answers</h2>
          <div className="grid3">
            <Feature
              title="Where is heat risk highest?"
              body="ECOSTRESS/MODIS anomalies + population vulnerability rank neighborhoods for cooling actions."
              href="/Calor"
              tag="Heat"
            />
            <Feature
              title="Who lacks park access?"
              body="Sentinel-2 NDVI + 10-minute walk buffers reveal greenspace deserts and micro-park candidates."
              href="/Greengap"
              tag="Greenspace"
            />
            <Feature
              title="Where should facilities go?"
              body="Combine growth, access, and risk layers to propose healthcare sites close to those who need them most."
              href="/Hospitales"
              tag="Healthcare"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section light">
        <div className="container">
          <h2 className="h2">How it works</h2>
          <ol className="steps">
            <li className="step"><b>Ingest</b> NASA/partner layers (GIBS, Sentinel-2, WorldPop, SEDAC).</li>
            <li className="step"><b>Compute</b> indices on a common grid (Heat, GreenGap, Growth/Access).</li>
            <li className="step"><b>Prioritize</b> top areas with plain-language actions per department.</li>
          </ol>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container fwrap">
          <div>Built for the <b>2025 NASA Space Apps Challenge</b> · CityPulse</div>
          <div className="small">Sources: NASA GIBS, Copernicus Sentinel-2, WorldPop, SEDAC, OSM.</div>
        </div>
      </footer>

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
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 16px 28px;
          display: grid;
          gap: 22px;
          grid-template-columns: 1.2fr .8fr;
          align-items: center;
        }
        .badge {
          display: inline-block; padding: 4px 10px; border-radius: 999px;
          background: #0ea5e980; color: #04283b; font-size: 12px; font-weight: 800;
          border: 1px solid #7dd3fc;
        }
        h1 {
          margin: 10px 0 8px;
          font-size: 40px; line-height: 1.1; letter-spacing: .2px;
        }
        .lead { margin: 0; opacity: .95; max-width: 60ch }
        .ctaRow { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px }
        .btn {
          text-decoration: none; display: inline-block;
          padding: 10px 14px; border-radius: 12px; font-weight: 800; font-size: 14px;
          border: 1px solid transparent; color: #031224;
          box-shadow: 0 8px 26px rgba(14,165,233,.25);
          transition: transform .06s ease;
        }
        .btn:active { transform: translateY(1px) }
        .btn.primary { background: linear-gradient(90deg, #22d3ee, #60a5fa) }
        .btn.sky { background: linear-gradient(90deg, #38bdf8, #0ea5e9) }
        .btn.emerald { background: linear-gradient(90deg, #34d399, #10b981) }

        .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px }
        .chip {
          background: #0b2a3a; color: #bfeaff; border: 1px solid #1d5b74;
          padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
        }

        .viz .card {
          background: rgba(2,6,23,.6);
          border: 1px solid rgba(148,163,184,.25);
          border-radius: 16px;
          padding: 16px;
          backdrop-filter: blur(4px);
          box-shadow: 0 12px 36px rgba(2,6,23,.45);
        }
        .globe { width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden }
        .vizCaption { font-size: 12px; color: #a6e0ff; opacity: .85; margin-top: 8px; text-align: center }

        .section { padding: 48px 0 }
        .section.light { background: #f8fafc; border-top: 1px solid #e2e8f0 }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 16px }
        .h2 { font-size: 28px; margin: 0 0 12px }
        .grid3 { display: grid; gap: 14px; grid-template-columns: 1fr; }
        @media (min-width: 820px) { .grid3 { grid-template-columns: repeat(3, 1fr) } }

        .card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;
          box-shadow: 0 6px 22px rgba(15,23,42,.05);
        }
        .featureTitle { font-size: 18px; margin: 0 0 6px }
        .featureBody { color: #334155; font-size: 15px; margin: 0 0 8px }
        .tag { font-size: 11px; background: #0ea5e9; color: #031224; padding: 2px 6px; border-radius: 999px; font-weight: 800 }

        .steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px }
        .step { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px }

        .footer { border-top: 1px solid #e2e8f0; background: #fff }
        .fwrap { display: grid; gap: 6px; padding: 16px 0; color: #334155 }
        .small { font-size: 12px; color: #64748b }
        @media (max-width: 900px) {
          .wrap { grid-template-columns: 1fr; }
          h1 { font-size: 34px }
        }
      `}</style>
    </>
  );
}

function Feature({ title, body, href, tag }) {
  return (
    <Link href={href} className="card" style={{ display: "block", textDecoration: "none" }}>
      <h3 className="featureTitle">{title}</h3>
      <p className="featureBody">{body}</p>
      <span className="tag">{tag} →</span>
    </Link>
  );
}
