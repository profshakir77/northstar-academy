import { useEffect, useState } from 'react';
import { api, date, pkr } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert } from '../components/ui.jsx';

const Status = ({ s }) => <span className={`tag ${s === 'active' || s === 'closed' ? 'tag-ok' : s === 'pending' || s === 'new' ? 'tag-warn' : ''}`}>{s}</span>;

export function AdminOverview() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/admin/stats').then(setS).catch((e) => setErr(e.message)); }, []);
  if (!s) return err ? <Alert>{err}</Alert> : <div className="spinner" />;
  const cards = [['Students', s.students], ['Teachers', s.instructors], ['Courses', s.courses], ['Active enrollments', s.active], ['Pending payments', s.pending], ['New applications', s.newApplications], ['New trial requests', s.newInquiries], ['Revenue (paid)', pkr(s.revenue)]];
  return (
    <>
      <div className="dash-head"><div><h1>Academy overview</h1><p className="muted">Live numbers from the database.</p></div></div>
      <div className="stats wide">{cards.map(([k, v]) => <div key={k} className="stat"><span>{k}</span><strong>{v}</strong></div>)}</div>
      <h2 className="h-sm">Latest enrollments</h2>
      <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>{s.recent.map((r) => <tr key={r.id}><td>{r.student}</td><td>{r.course}</td><td><Status s={r.status} /></td><td>{r.method}</td><td>{pkr(r.amount)}</td><td>{date(r.at)}</td></tr>)}</tbody></table></div>
    </>
  );
}

export function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const load = () => api('/admin/users', { query: { role, q } }).then((d) => setUsers(d.users)).catch((e) => setMsg({ ok: '', err: e.message }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [role]);
  async function patch(u, body) {
    try { const d = await api(`/admin/users/${u.id}`, { method: 'PATCH', body }); setUsers((l) => l.map((x) => (x.id === u.id ? d.user : x))); setMsg({ ok: `Updated ${d.user.name}.`, err: '' }); } catch (e) { setMsg({ ok: '', err: e.message }); }
  }
  return (
    <>
      <div className="dash-head"><div><h1>Users</h1><p className="muted">Change roles or deactivate accounts.</p></div></div>
      <Alert>{msg.err}</Alert><Alert kind="ok">{msg.ok}</Alert>
      <form className="filters slim" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="student">Students</option><option value="instructor">Teachers</option><option value="admin">Admins</option></select>
        <button className="btn btn-primary">Search</button>
      </form>
      {!users ? <div className="spinner" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td>
              <td><select value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u, { role: e.target.value })}><option value="student">student</option><option value="instructor">instructor</option><option value="admin">admin</option></select></td>
              <td><button className={`btn btn-sm ${u.active ? 'btn-light' : 'btn-danger'}`} disabled={u.id === me.id} onClick={() => patch(u, { active: !u.active })}>{u.active ? 'Active' : 'Disabled'}</button></td>
              <td>{date(u.createdAt)}</td>
            </tr>
          ))}</tbody></table></div>
      )}
    </>
  );
}

export function AdminEnrollments() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState({ ok: '', err: '' });
  useEffect(() => { api('/admin/enrollments').then((d) => setList(d.enrollments)).catch((e) => setMsg({ ok: '', err: e.message })); }, []);
  async function patch(e, status) {
    const body = { status, ...(status === 'active' && e.method === 'stripe' && e.status !== 'active' ? { paymentMethod: 'cash' } : {}) };
    try { await api(`/admin/enrollments/${e.id}`, { method: 'PATCH', body }); setList((l) => l.map((x) => (x.id === e.id ? { ...x, status, ...(body.paymentMethod ? { method: body.paymentMethod } : {}) } : x))); setMsg({ ok: 'Enrollment updated.', err: '' }); } catch (e2) { setMsg({ ok: '', err: e2.message }); }
  }
  return (
    <>
      <div className="dash-head"><div><h1>Enrollments</h1><p className="muted">Mark cash payments as paid, or cancel an enrollment.</p></div></div>
      <Alert>{msg.err}</Alert><Alert kind="ok">{msg.ok}</Alert>
      {!list ? <div className="spinner" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>Course</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{list.map((e) => (
            <tr key={e.id}><td>{e.student}<small className="muted">{e.email}</small></td><td>{e.course}</td><td>{pkr(e.amount)}</td><td>{e.method}</td><td>{date(e.at)}</td>
              <td><select value={e.status} onChange={(ev) => patch(e, ev.target.value)}><option value="pending">pending</option><option value="active">active</option><option value="cancelled">cancelled</option></select></td></tr>
          ))}</tbody></table></div>
      )}
    </>
  );
}

export function AdminInquiries() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/admin/inquiries').then((d) => setList(d.inquiries)).catch((e) => setErr(e.message)); }, []);
  async function patch(i, status) {
    try { await api(`/admin/inquiries/${i.id}`, { method: 'PATCH', body: { status } }); setList((l) => l.map((x) => (x.id === i.id ? { ...x, status } : x))); } catch (e) { setErr(e.message); }
  }
  return (
    <>
      <div className="dash-head"><div><h1>Trial class requests</h1><p className="muted">Free trial requests sent from the admissions page.</p></div></div>
      <Alert>{err}</Alert>
      {!list ? <div className="spinner" /> : list.length === 0 ? <p className="muted">No inquiries yet.</p> : (
        <div className="inq-list">{list.map((i) => (
          <article key={i.id} className="card inq">
            <div className="inq-head"><div><strong>{i.name}</strong> <span className="muted">· {i.email}{i.phone ? ` · ${i.phone}` : ''}</span></div><Status s={i.status} /></div>
            <p className="muted small">{i.level || 'Level not given'} · {date(i.createdAt)}</p>
            <p>{i.message}</p>
            <div className="row-gap">{['new', 'contacted', 'closed'].map((s) => <button key={s} className={`btn btn-sm ${i.status === s ? 'btn-primary' : 'btn-light'}`} onClick={() => patch(i, s)}>{s}</button>)}</div>
          </article>
        ))}</div>
      )}
    </>
  );
}

const APP_STATUSES = ['submitted', 'test scheduled', 'admitted', 'waitlisted', 'declined'];

export function AdminApplications() {
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState({ ok: '', err: '' });
  useEffect(() => { api('/admin/applications').then((d) => setList(d.applications)).catch((e) => setMsg({ ok: '', err: e.message })); }, []);
  async function patch(a, body) {
    try { await api(`/admin/applications/${a.id}`, { method: 'PATCH', body }); setList((l) => l.map((x) => (x.id === a.id ? { ...x, ...body } : x))); setMsg({ ok: `Updated ${a.ref}.`, err: '' }); } catch (e) { setMsg({ ok: '', err: e.message }); }
  }
  const shown = (list || []).filter((a) => !filter || a.status === filter);
  return (
    <>
      <div className="dash-head"><div><h1>Admission applications</h1><p className="muted">Applications from the admissions page. Book the placement test, then mark the result.</p></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}><option value="">All statuses</option>{APP_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <Alert>{msg.err}</Alert><Alert kind="ok">{msg.ok}</Alert>
      {!list ? <div className="spinner" /> : shown.length === 0 ? <p className="muted">No applications yet.</p> : (
        <div className="inq-list">{shown.map((a) => (
          <article key={a.id} className="card inq">
            <div className="inq-head">
              <div><strong>{a.student.name}</strong> <span className="muted">· {a.student.level} · {a.ref}</span></div>
              <select value={a.status} onChange={(e) => patch(a, { status: e.target.value })} style={{ width: 'auto' }}>{APP_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <p className="muted small">{a.guardian.name}{a.guardian.relation ? ` (${a.guardian.relation})` : ''} · {a.guardian.phone} · {a.guardian.email} · {date(a.createdAt)}</p>
            <p>{a.courses.map((c) => c.title).join(', ')} · <strong>{pkr(a.courses.reduce((s, c) => s + c.price, 0))}</strong>{a.concession && <span className="tag tag-warn" style={{ marginLeft: 8 }}>concession requested</span>}</p>
            <button type="button" className="linkish small" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? 'Hide details' : 'Show details'}</button>
            {open === a.id && (
              <div className="app-detail">
                <dl>
                  <div><dt>Date of birth</dt><dd>{a.student.dob ? date(a.student.dob) : '-'}</dd></div>
                  <div><dt>Gender</dt><dd>{a.student.gender || '-'}</dd></div>
                  <div><dt>School</dt><dd>{a.student.school || '-'}</dd></div>
                  <div><dt>Board</dt><dd>{a.student.board || '-'}</dd></div>
                  <div><dt>Last result</dt><dd>{a.student.lastResult || '-'}</dd></div>
                  <div><dt>Mode</dt><dd>{a.mode}</dd></div>
                  <div><dt>City / address</dt><dd>{[a.guardian.city, a.guardian.address].filter(Boolean).join(', ') || '-'}</dd></div>
                  <div><dt>Heard from</dt><dd>{a.heardFrom || '-'}</dd></div>
                </dl>
                {a.notes && <p><strong>Notes:</strong> {a.notes}</p>}
                <label className="small">Note shown to the parent on the status page
                  <input defaultValue={a.adminNote || ''} maxLength={500} onBlur={(e) => e.target.value !== (a.adminNote || '') && patch(a, { adminNote: e.target.value })} placeholder="e.g. Placement test on Saturday at 11 am" />
                </label>
              </div>
            )}
          </article>
        ))}</div>
      )}
    </>
  );
}
