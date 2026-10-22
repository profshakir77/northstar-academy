import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useSeo } from '../seo.js';
import { Alert } from '../components/ui.jsx';

// Only allow same-site relative paths after sign-in.
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/dashboard');

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ email: '', password: '' });
  const [demo, setDemo] = useState(null);
  const [state, setState] = useState({ busy: false, err: '' });
  useSeo({ title: 'Sign in', path: '/login', noindex: true });
  useEffect(() => { api('/config').then((d) => setDemo(d.demo)).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, err: '' });
    try { await login(f.email, f.password); nav(safeNext(params.get('next')), { replace: true }); } catch (e2) { setState({ busy: false, err: e2.message }); }
  }

  return (
    <section className="auth-wrap">
      <form className="card form auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to see your classes, lessons and progress.</p>
        <Alert>{state.err}</Alert>
        <label>Email<input type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn btn-primary btn-block" disabled={state.busy}>{state.busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted center">New here? <Link to="/register">Create a student account</Link></p>
        {demo && (
          <div className="demo-box">
            <strong>Try the demo accounts</strong>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setF(demo.student)}>Fill student login</button>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setF(demo.instructor)}>Fill teacher login</button>
            <small>Student: {demo.student.email} / {demo.student.password}<br />Teacher: {demo.instructor.email} / {demo.instructor.password}</small>
          </div>
        )}
      </form>
    </section>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', grade: '' });
  const [state, setState] = useState({ busy: false, err: '' });
  useSeo({ title: 'Create a student account', path: '/register', noindex: true });
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, err: '' });
    try { await register(f); nav('/courses', { replace: true }); } catch (e2) { setState({ busy: false, err: e2.message }); }
  }

  return (
    <section className="auth-wrap">
      <form className="card form auth-card" onSubmit={submit}>
        <h1>Create a student account</h1>
        <p className="muted">One account per student. Parents can sign in with the same details.</p>
        <Alert>{state.err}</Alert>
        <label>Student’s full name<input required autoComplete="name" value={f.name} onChange={on('name')} /></label>
        <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={on('email')} /></label>
        <label>Password<input type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={on('password')} /><small className="muted">At least 8 characters.</small></label>
        <div className="grid2">
          <label>Phone<input value={f.phone} onChange={on('phone')} /></label>
          <label>Class / grade<input placeholder="e.g. Class 10" value={f.grade} onChange={on('grade')} /></label>
        </div>
        <button className="btn btn-primary btn-block" disabled={state.busy}>{state.busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted center">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </section>
  );
}
