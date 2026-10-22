import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Crest({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M32 3 L56 10 V30 C56 45 46 55 32 61 C18 55 8 45 8 30 V10 Z" fill="#0f2a4a" />
      <path d="M32 7.5 L52 13.3 V30 C52 42.6 43.6 51.2 32 56.6 C20.4 51.2 12 42.6 12 30 V13.3 Z" fill="none" stroke="#e9b44c" strokeWidth="1.6" />
      <path d="M17 33 C22 30.5 27 30.5 32 33.5 C37 30.5 42 30.5 47 33 V45 C42 42.6 37 42.6 32 45.6 C27 42.6 22 42.6 17 45 Z" fill="#fff" />
      <path d="M32 33.5 V45.6" stroke="#0f2a4a" strokeWidth="1.4" />
      <path d="M20.5 36.2 C23.5 35 26.5 35 29 36.4 M20.5 39.4 C23.5 38.2 26.5 38.2 29 39.6 M35 36.4 C37.5 35 40.5 35 43.5 36.2 M35 39.6 C37.5 38.2 40.5 38.2 43.5 39.4" stroke="#9fb0c4" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M32 13 L36 27 L32 25 L28 27 Z" fill="#e9b44c" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Northstar Tuition Academy, home">
      <Crest />
      <span><strong>Northstar</strong><small>Tuition Academy</small></span>
    </Link>
  );
}

const links = [['/courses', 'Courses'], ['/teachers', 'Teachers'], ['/about', 'About'], ['/admissions', 'Admissions']];

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <header className="header">
      <div className="topbar"><div className="container">Admissions are open for the new session · Office hours Monday to Saturday, 9 am to 8 pm · 0300 000 0000 (demo number)</div></div>
      <div className="container nav">
        <Logo />
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>
        <nav className={open ? 'links open' : 'links'}>
          {links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          {user ? (
            <>
              <NavLink to="/dashboard" className="btn btn-ghost">Dashboard</NavLink>
              <button className="btn btn-light" onClick={async () => { await logout(); nav('/'); }}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <Link to="/register" className="btn btn-primary">Enroll now</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>A tuition academy in Islamabad for Grade 6 to A Level. Small classes, a short test every week and a progress report for parents every month.</p>
        </div>
        <div>
          <h4>Programs</h4>
          <Link to="/courses?level=Matric%20(9-10)">Matric (9-10)</Link>
          <Link to="/courses?level=FSc%20%2F%20ICS%20(11-12)">FSc / ICS</Link>
          <Link to="/courses?level=O%20Level">O Level</Link>
          <Link to="/courses?level=A%20Level">A Level</Link>
        </div>
        <div>
          <h4>Academy</h4>
          <Link to="/teachers">Our teachers</Link>
          <Link to="/about">About us</Link>
          <Link to="/admissions">Admissions</Link>
          <Link to="/login">Student portal</Link>
        </div>
        <div>
          <h4>Visit us</h4>
          <p>Plot 12, Main Boulevard (demo address)<br />Islamabad, Pakistan<br />hello@northstar.example</p>
        </div>
      </div>
      <div className="container footer-note">
        <span>© {new Date().getFullYear()} Northstar Tuition Academy. A demo project: the academy, people and contact details are fictional.</span>
        <span>Designed and built with MongoDB, Express, React and Node by <a href="https://shakir-portfolio-azure.vercel.app" target="_blank" rel="noreferrer">Shakir Hussain</a>.</span>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
