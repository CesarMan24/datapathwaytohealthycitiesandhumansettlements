// app/Header/Header.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isActive = (href) => pathname?.toLowerCase().startsWith(href.toLowerCase());

  return (
    <header className="site-header">
      <div className="header-wrap">
        {/* Logo / Title */}
        <Link href="/" className="brand">
  {/* Replaced SVG logo with external image */}
  <img
    src="https://i.ibb.co/tpH6p1X5/Chill-Guy-removebg-preview.png"  // ← use the DIRECT image URL from imgbb (starts with https://i.ibb.co/)
    alt="Chill Team logo"
    width="28"
    height="28"
    className="logo"
  />
  <div className="titles">
    <strong>CityPulse</strong>
    <small>NASA Space Apps ’25</small>
  </div>
</Link>

        {/* Nav */}
        <nav className="nav">
        <NavLink href="/" active={isActive('/')}>Home</NavLink>
          <NavLink href="/Pollutedareas" active={isActive('/Pollutedareas')}>Polluted Areas</NavLink>
          <NavLink href="/Greengap" active={isActive('/Greengap')}>Greenspace</NavLink>
          <NavLink href="/Hospitales" active={isActive('/Hospitales')}>Hospitals</NavLink>
          <NavLink href="/About" active={isActive('/About')}>About</NavLink>
        </nav>
      </div>

      {/* styled-jsx keeps this self-contained */}
      <style jsx>{`
  .site-header {
    position: sticky; top: 0; z-index: 50;
    border-bottom: 1px solid rgba(148, 163, 184, .25);
    background:
      radial-gradient(900px 300px at 50% -80px, rgba(56,189,248,.25), transparent 60%),
      linear-gradient(180deg, rgba(2,6,23,.95), rgba(2,6,23,.9));
    color: #e5f3ff;
    backdrop-filter: blur(8px);
  }
  .header-wrap {
    max-width: 1100px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px;
  }
  /* ⬇️ increased gap between logo and titles */
  .brand { display: flex; align-items: center; gap: 14px; color: inherit; text-decoration: none; }

  .globe { display: grid; place-items: center; filter: drop-shadow(0 2px 8px rgba(56,189,248,.45)); }

  /* ⬇️ added row-gap + a touch more line-height */
  .titles { line-height: 1.15; display: flex; flex-direction: column; row-gap: 4px; }
  .titles strong { font-size: 18px; letter-spacing: .2px; }
  /* ⬇️ small top margin pushes the subtitle down a bit more */
  .titles small { margin-top: 1px; font-size: 11px; color: #a5e1ff; opacity: .9; }

  .nav { display: flex; gap: 18px; align-items: center; }
  .link {
    position: relative; font-size: 16px; font-weight: 600;
    color: #cfefff; opacity: .9; text-decoration: none;
    padding: 6px 2px; transition: opacity .15s ease;
  }
  .link:hover { opacity: 1; }
  .link.active { color: #ffffff; opacity: 1; }
  .link.active::after, .link:hover::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px;
    background: linear-gradient(90deg, #22d3ee, #60a5fa, #34d399);
    border-radius: 2px;
  }

  .cta {
    background: linear-gradient(90deg, #22d3ee, #60a5fa);
    color: #031224; text-decoration: none;
    padding: 8px 12px; border-radius: 10px; font-weight: 800; font-size: 14px;
    box-shadow: 0 6px 20px rgba(96,165,250,.35);
  }
  .cta:hover { filter: brightness(1.05); }

  @media (max-width: 720px) {
    .titles strong { font-size: 16px; }
    .nav { gap: 12px; }
    .cta { display: none; }
  }
`}</style>
    </header>
  );
}

function NavLink({ href, active, children, colorKey }) {
  const getColor = () => {
    if (!active) return 'transparent';
    switch(colorKey) {
      case 'calor': return '#ef4444';
      case 'greengap': return '#34d399';
      case 'hospitales': return '#10b981';
      default: return '#60a5fa';
    }
  };

  return (
    <>
      <Link href={href} className={`link${active ? ' active' : ''}`}>
        {children}
      </Link>
      <style jsx>{`
        .link {
          position: relative; font-size: 16px; font-weight: 600;
          color: ${active ? '#ffffff' : '#cfefff'}; 
          opacity: ${active ? 1 : 0.9};
          text-decoration: none;
          padding: 6px 2px; 
          transition: opacity .15s ease;
        }
        .link:hover { opacity: 1; }
        .link.active::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -6px;
          height: 2px;
          background: ${getColor()};
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}
