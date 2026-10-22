import { useState } from 'react';
import { api } from '../api.js';
import { useSeo } from '../seo.js';
import { Alert } from '../components/ui.jsx';

const LEVELS = ['Grade 6-8', 'Matric (9-10)', 'FSc / ICS (11-12)', 'O Level', 'A Level'];

export default function Admissions() {
  const [f, setF] = useState({ name: '', email: '', phone: '', level: '', message: '', website: '' });
  const [state, setState] = useState({ busy: false, ok: '', err: '' });
  useSeo({ title: 'Admissions and Free Trial Class', description: 'Book a free trial class at Northstar Tuition Academy, Islamabad. Tell us the class and subjects and we call back within one working day.', path: '/admissions' });
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, ok: '', err: '' });
    try {
      const r = await api('/inquiries', { method: 'POST', body: f });
      setState({ busy: false, ok: r.message, err: '' });
      setF({ name: '', email: '', phone: '', level: '', message: '', website: '' });
    } catch (e2) { setState({ busy: false, ok: '', err: e2.message }); }
  }

  return (
    <>
      <section className="page-hero"><div className="container"><span className="eyebrow">Admissions</span><h1>Book a free trial class</h1><p className="lead">Tell us your child’s class and the subjects you need help with. We will call back within one working day to arrange a trial and a short placement test.</p></div></section>
      <section className="section tight">
        <div className="container split top">
          <form className="card form" onSubmit={submit}>
            <Alert>{state.err}</Alert><Alert kind="ok">{state.ok}</Alert>
            <div className="grid2">
              <label>Parent or student name<input required value={f.name} onChange={on('name')} /></label>
              <label>Email<input type="email" required value={f.email} onChange={on('email')} /></label>
              <label>Phone (optional)<input value={f.phone} onChange={on('phone')} /></label>
              <label>Level<select value={f.level} onChange={on('level')}><option value="">Choose…</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
            </div>
            <label>Which subjects, and anything we should know?<textarea rows="5" required value={f.message} onChange={on('message')} /></label>
            <label className="hp" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={f.website} onChange={on('website')} /></label>
            <button className="btn btn-primary" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send request'}</button>
          </form>
          <div className="info-stack">
            <div className="card info"><h3>Fees</h3><p>Fees are per course, paid at enrollment. Siblings get 10% off the second course. Fee concessions are available for students who need them.</p></div>
            <div className="card info"><h3>Timings</h3><p>Weekday classes run from 3:30 pm to 9 pm. Weekend batches run from 11 am. Online classes use live video with recordings.</p></div>
            <div className="card info"><h3>Documents</h3><p>Bring the latest school result card for the placement test. No other documents are needed.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
