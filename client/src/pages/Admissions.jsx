import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, pkr } from '../api.js';
import { useSeo, crumbs } from '../seo.js';
import { Alert } from '../components/ui.jsx';

const LEVELS = ['Grade 6-8', 'Matric (9-10)', 'FSc / ICS (11-12)', 'O Level', 'A Level'];
const ADMISSION_FEE = 5000;

const steps = [
  ['Apply', 'Fill in the application below. It takes about five minutes and you get a reference number straight away.'],
  ['Placement test', 'We call within one working day to book a 30-minute test in the main subject. It is only to place your child in the right group.'],
  ['Trial class', 'Your child sits in on one real class for free. Parents are welcome to stay for the first ten minutes.'],
  ['Confirm and pay', 'Pay the one-time admission fee and the course fee, then the student portal opens with notes and recordings.'],
];

const eligibility = [
  ['Grade 6-8', 'Students in Class 6, 7 or 8 at any school. No entry test, only a short placement check.'],
  ['Matric (9-10)', 'Students in Class 9 or 10, Federal or Punjab Board. Bring the latest school result.'],
  ['FSc / ICS (11-12)', 'Matric passed or result awaited. Pre-medical, pre-engineering and ICS groups.'],
  ['O Level', 'Cambridge O Level students in any year. We ask which papers and which session you are sitting.'],
  ['A Level', 'AS or A2 students. Seats are limited to 20 per class, so apply early.'],
];

const documents = [
  'Latest school result card or report (a phone photo is fine)',
  'Student’s B-Form or school ID card, for our records only',
  'One passport-size photograph for the student card',
  'Parent or guardian CNIC number for the fee receipt',
];

const fees = [
  ['Admission fee', 'Rs 5,000', 'One time, when the seat is confirmed'],
  ['Grade 6-8', 'Rs 15,000', 'Per course, per term'],
  ['Matric (9-10)', 'Rs 22,000 to 24,000', 'Per course, per term'],
  ['FSc / ICS (11-12)', 'Rs 30,000 to 38,000', 'Per course, per term'],
  ['O Level', 'Rs 38,000 to 45,000', 'Per course, per term'],
  ['A Level', 'Rs 55,000', 'Per course, per term'],
];

const policies = [
  ['Sibling discount', '10% off the second child’s courses, and 15% off for a third child.'],
  ['Fee concessions', 'Up to 50% off for students who need it. Tick the box on the form and we will talk about it privately.'],
  ['Merit scholarship', 'Students who score 90% or above in their last board exam get 25% off the course fee.'],
  ['Refunds', 'Full refund of the course fee if you withdraw in the first two weeks. The admission fee is not refundable.'],
];

const blankApp = {
  student: { name: '', dob: '', gender: '', level: '', school: '', board: '', lastResult: '' },
  guardian: { name: '', relation: '', phone: '', email: '', city: 'Islamabad', address: '' },
  courses: [], mode: 'No preference', heardFrom: '', notes: '', concession: false, consent: false, website: '',
};

export default function Admissions() {
  const [tab, setTab] = useState('apply');
  useSeo({
    title: 'Admissions 2026: Apply Online, Fees and Documents',
    description: 'Apply online to Northstar Tuition Academy, Islamabad. Admission process, eligibility for Grade 6 to A Level, fee structure, documents needed, scholarships and a free trial class.',
    path: '/admissions',
    jsonLd: crumbs([['Home', '/'], ['Admissions', '/admissions']]),
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Admissions open · New session</span>
          <h1>Admissions</h1>
          <p className="lead">Apply online in about five minutes. We call back within one working day to book a placement test and a free trial class. Nothing is paid until you have seen a class.</p>
          <div className="hero-cta"><a href="#apply" className="btn btn-primary btn-lg">Apply now</a><a href="#fees" className="btn btn-light btn-lg">See fees</a></div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-head"><span className="eyebrow">How it works</span><h2>Four steps from application to first class</h2></div>
          <ol className="adm-steps">{steps.map(([t, d], i) => <li key={t} className="card"><span className="step-no">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>)}</ol>
        </div>
      </section>

      <section className="section alt">
        <div className="container split top">
          <div>
            <span className="eyebrow">Who can apply</span>
            <h2>Eligibility by level</h2>
            <dl className="elig">{eligibility.map(([l, d]) => <div key={l}><dt>{l}</dt><dd>{d}</dd></div>)}</dl>
          </div>
          <div>
            <span className="eyebrow">What to bring</span>
            <h2>Documents</h2>
            <ul className="ticks one">{documents.map((d) => <li key={d}>{d}</li>)}</ul>
            <div className="card info dates">
              <h3>Key dates this session</h3>
              <ul className="week">
                <li><span>Applications open</span><b>1 October</b></li>
                <li><span>Placement tests</span><b>Every Saturday</b></li>
                <li><span>Classes begin</span><b>5 November</b></li>
                <li><span>Late admissions</span><b>Until 30 November, if seats are left</b></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="fees">
        <div className="container">
          <div className="section-head row"><div><span className="eyebrow">Fee structure</span><h2>Fees for the new session</h2></div><Link to="/courses" className="btn btn-ghost">Fee for each course</Link></div>
          <div className="table-wrap"><table className="table fee-table"><thead><tr><th>Item</th><th>Fee</th><th>When</th></tr></thead>
            <tbody>{fees.map(([a, b, c]) => <tr key={a}><td><strong>{a}</strong></td><td>{b}</td><td className="muted">{c}</td></tr>)}</tbody></table></div>
          <p className="fineprint">A term is about 14 weeks. Fees include notes, weekly tests, recordings and the monthly parent report. Fees can be paid online by card or at the office.</p>
          <div className="policy-grid">{policies.map(([t, d]) => <div key={t} className="card info"><h3>{t}</h3><p>{d}</p></div>)}</div>
        </div>
      </section>

      <section className="section alt" id="apply">
        <div className="container">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'apply'} className={tab === 'apply' ? 'on' : ''} onClick={() => setTab('apply')}>Admission application</button>
            <button role="tab" aria-selected={tab === 'trial'} className={tab === 'trial' ? 'on' : ''} onClick={() => setTab('trial')}>Just a free trial class</button>
            <button role="tab" aria-selected={tab === 'status'} className={tab === 'status' ? 'on' : ''} onClick={() => setTab('status')}>Check application status</button>
          </div>
          {tab === 'apply' && <ApplicationForm />}
          {tab === 'trial' && <TrialForm />}
          {tab === 'status' && <StatusCheck />}
        </div>
      </section>
    </>
  );
}

function ApplicationForm() {
  const [f, setF] = useState(blankApp);
  const [courses, setCourses] = useState([]);
  const [state, setState] = useState({ busy: false, err: '', done: null });
  useEffect(() => { api('/courses').then((d) => setCourses(d.courses)).catch(() => {}); }, []);

  const set = (group, k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => (group ? { ...x, [group]: { ...x[group], [k]: v } } : { ...x, [k]: v }));
  };
  const toggleCourse = (id) => setF((x) => ({ ...x, courses: x.courses.includes(id) ? x.courses.filter((c) => c !== id) : [...x.courses, id] }));

  const shown = useMemo(() => (f.student.level ? courses.filter((c) => c.level === f.student.level) : courses), [courses, f.student.level]);
  const chosen = courses.filter((c) => f.courses.includes(c.id));
  const tuition = chosen.reduce((a, c) => a + c.price, 0);

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, err: '', done: null });
    try {
      const r = await api('/applications', { method: 'POST', body: f });
      setState({ busy: false, err: '', done: r });
      window.scrollTo({ top: document.getElementById('apply').offsetTop - 80, behavior: 'smooth' });
    } catch (e2) { setState({ busy: false, err: e2.message, done: null }); }
  }

  if (state.done) {
    const d = state.done;
    return (
      <div className="card form center applied">
        <div className="big-check">✓</div>
        <h2>Application received</h2>
        <p>Your reference number is</p>
        <p className="ref-no">{d.ref}</p>
        <p className="muted">Please keep it. We will call {f.guardian.phone} within one working day to book the placement test.</p>
        <div className="table-wrap left"><table className="table"><tbody>
          {d.courses.map((c) => <tr key={c}><td>{c}</td></tr>)}
          <tr><td><strong>Course fees: {pkr(d.tuition)}</strong> · Admission fee: {pkr(d.admissionFee)} (paid after the trial class)</td></tr>
        </tbody></table></div>
        <button className="btn btn-light" onClick={() => { setF(blankApp); setState({ busy: false, err: '', done: null }); }}>Submit another application</button>
      </div>
    );
  }

  return (
    <form className="card form app-form" onSubmit={submit}>
      <div>
        <h2>Admission application</h2>
        <p className="muted">Fields marked * are required. We only use these details to process the admission.</p>
      </div>
      <Alert>{state.err}</Alert>

      <fieldset>
        <legend>1. Student</legend>
        <div className="grid3">
          <label className="span2">Student’s full name *<input required value={f.student.name} onChange={set('student', 'name')} autoComplete="off" /></label>
          <label>Date of birth<input type="date" value={f.student.dob} onChange={set('student', 'dob')} /></label>
          <label>Gender<select value={f.student.gender} onChange={set('student', 'gender')}><option value="">Choose…</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
          <label>Applying for *<select required value={f.student.level} onChange={(e) => { set('student', 'level')(e); setF((x) => ({ ...x, courses: [] })); }}><option value="">Choose a level…</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
          <label>Board / syllabus<select value={f.student.board} onChange={set('student', 'board')}><option value="">Choose…</option><option>Federal Board</option><option>Punjab Board</option><option>Cambridge</option><option>Other</option></select></label>
          <label className="span2">Current school or college<input value={f.student.school} onChange={set('student', 'school')} /></label>
          <label>Last result (% or grade)<input value={f.student.lastResult} onChange={set('student', 'lastResult')} placeholder="e.g. 82% or B" /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>2. Courses *</legend>
        {!f.student.level && <p className="muted small">Choose a level above to see its courses.</p>}
        <div className="course-picks">
          {shown.map((c) => (
            <label key={c.id} className={`pick ${f.courses.includes(c.id) ? 'on' : ''}`}>
              <input type="checkbox" checked={f.courses.includes(c.id)} onChange={() => toggleCourse(c.id)} />
              <span><strong>{c.title}</strong><small>{c.mode} · {c.schedule}</small></span>
              <b>{pkr(c.price)}</b>
            </label>
          ))}
        </div>
        <div className="grid3">
          <label>Preferred mode<select value={f.mode} onChange={set(null, 'mode')}><option>No preference</option><option>On campus</option><option>Online</option><option>Hybrid</option></select></label>
        </div>
        {chosen.length > 0 && <p className="fee-sum">Course fees: <strong>{pkr(tuition)}</strong> + admission fee {pkr(ADMISSION_FEE)} = <strong>{pkr(tuition + ADMISSION_FEE)}</strong> <span className="muted">(before any discount)</span></p>}
      </fieldset>

      <fieldset>
        <legend>3. Parent or guardian</legend>
        <div className="grid3">
          <label className="span2">Full name *<input required value={f.guardian.name} onChange={set('guardian', 'name')} /></label>
          <label>Relation<select value={f.guardian.relation} onChange={set('guardian', 'relation')}><option value="">Choose…</option><option>Father</option><option>Mother</option><option>Guardian</option><option>Self (adult student)</option></select></label>
          <label>Mobile number *<input required type="tel" value={f.guardian.phone} onChange={set('guardian', 'phone')} placeholder="03xx xxxxxxx" /></label>
          <label>Email *<input required type="email" value={f.guardian.email} onChange={set('guardian', 'email')} /></label>
          <label>City<input value={f.guardian.city} onChange={set('guardian', 'city')} /></label>
          <label className="span3">Home address<input value={f.guardian.address} onChange={set('guardian', 'address')} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>4. Anything else</legend>
        <div className="grid3">
          <label>How did you hear about us?<select value={f.heardFrom} onChange={set(null, 'heardFrom')}><option value="">Choose…</option><option>Friend or family</option><option>Facebook or Instagram</option><option>Google search</option><option>School notice board</option><option>Walked past the campus</option><option>Other</option></select></label>
          <label className="span2">Notes for the teacher<textarea rows="3" value={f.notes} onChange={set(null, 'notes')} placeholder="Weak topics, exam dates, anything that helps us place your child" /></label>
        </div>
        <label className="check"><input type="checkbox" checked={f.concession} onChange={set(null, 'concession')} /> I would like to discuss a fee concession</label>
        <label className="check"><input type="checkbox" required checked={f.consent} onChange={set(null, 'consent')} /> The details above are correct, and Northstar may contact me about this admission. *</label>
      </fieldset>
      <label className="hp" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={f.website} onChange={set(null, 'website')} /></label>
      <button className="btn btn-primary btn-lg" disabled={state.busy || !f.courses.length}>{state.busy ? 'Submitting…' : 'Submit application'}</button>
      {!f.courses.length && <p className="muted small">Choose at least one course to submit.</p>}
    </form>
  );
}

function TrialForm() {
  const [f, setF] = useState({ name: '', email: '', phone: '', level: '', message: '', website: '' });
  const [state, setState] = useState({ busy: false, ok: '', err: '' });
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
    <form className="card form app-form" onSubmit={submit}>
      <div><h2>Book a free trial class</h2><p className="muted">Not ready to apply? Tell us the class and subject and we will book a free trial.</p></div>
      <Alert>{state.err}</Alert><Alert kind="ok">{state.ok}</Alert>
      <div className="grid2">
        <label>Parent or student name<input required value={f.name} onChange={on('name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={on('email')} /></label>
        <label>Phone<input value={f.phone} onChange={on('phone')} /></label>
        <label>Level<select value={f.level} onChange={on('level')}><option value="">Choose…</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
      </div>
      <label>Which subject, and a good day for the trial?<textarea rows="4" required value={f.message} onChange={on('message')} /></label>
      <label className="hp" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={f.website} onChange={on('website')} /></label>
      <button className="btn btn-primary" disabled={state.busy}>{state.busy ? 'Sending…' : 'Request a trial class'}</button>
    </form>
  );
}

function StatusCheck() {
  const [f, setF] = useState({ ref: '', email: '' });
  const [state, setState] = useState({ busy: false, err: '', data: null });
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, err: '', data: null });
    try { const d = await api(`/applications/${encodeURIComponent(f.ref.trim())}`, { query: { email: f.email.trim() } }); setState({ busy: false, err: '', data: d }); } catch (e2) { setState({ busy: false, err: e2.message, data: null }); }
  }
  const d = state.data;
  return (
    <form className="card form app-form" onSubmit={submit}>
      <div><h2>Check your application</h2><p className="muted">Use the reference number you got after applying and the parent’s email.</p></div>
      <Alert>{state.err}</Alert>
      <div className="grid2">
        <label>Reference number<input required placeholder="NS-2026-0001" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></label>
        <label>Parent’s email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <button className="btn btn-primary" disabled={state.busy}>{state.busy ? 'Checking…' : 'Check status'}</button>
      {d && (
        <div className="status-box">
          <p><strong>{d.student}</strong> · {d.level} · {d.ref}</p>
          <p>Status: <span className={`tag ${d.status === 'admitted' ? 'tag-ok' : d.status === 'declined' ? '' : 'tag-warn'}`}>{d.status}</span></p>
          <p className="muted small">{d.courses.join(', ')}</p>
          {d.note && <p>{d.note}</p>}
        </div>
      )}
    </form>
  );
}
