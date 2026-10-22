import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Northstar Tuition Academy home">
      <svg viewBox="0 0 64 64" width="38" height="38" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0f2a4a" /><path d="M32 12l4.7 12.3L49 29l-12.3 4.7L32 46l-4.7-12.3L15 29l12.3-4.7z" fill="#f2a93b" /><path d="M18 52h28" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
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
      <div className="topbar"><div className="container">Admissions open for the new session · Call 0300 000 0000 (demo) · Mon to Sat, 9 am to 8 pm</div></div>
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
          <p>Small-group tuition for Grade 6 to A Level, with weekly tests and monthly reports for parents.</p>
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
