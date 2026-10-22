import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api, date, pkr } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Empty, Img, Initials } from '../components/ui.jsx';
import CourseManager from './CourseManager.jsx';
import { useSeo } from '../seo.js';
import { AdminOverview, AdminUsers, AdminEnrollments, AdminInquiries } from './Admin.jsx';

const menus = {
  student: [['', 'My classes'], ['profile', 'Profile']],
  instructor: [['', 'My courses'], ['profile', 'Profile']],
  admin: [['', 'Overview'], ['courses', 'Courses'], ['users', 'Users'], ['enrollments', 'Enrollments'], ['inquiries', 'Inquiries'], ['profile', 'Profile']],
};

export default function Dashboard() {
  const { user } = useAuth();
  useSeo({ title: 'Dashboard', path: '/dashboard', noindex: true });
  const menu = menus[user.role] || menus.student;
  return (
    <div className="container dash">
      <aside className="dash-side">
        <div className="who"><Initials name={user.name} size={44} /><div><strong>{user.name}</strong><span className="role">{user.role}</span></div></div>
        <nav>{menu.map(([to, label]) => <NavLink key={to} end to={`/dashboard${to ? `/${to}` : ''}`}>{label}</NavLink>)}</nav>
      </aside>
      <section className="dash-main">
        <Routes>
          <Route index element={user.role === 'admin' ? <AdminOverview /> : user.role === 'instructor' ? <CourseManager /> : <StudentHome />} />
          <Route path="profile" element={<Profile />} />
          {user.role === 'admin' && (
            <>
              <Route path="courses" element={<CourseManager admin />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="enrollments" element={<AdminEnrollments />} />
              <Route path="inquiries" element={<AdminInquiries />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </section>
    </div>
  );
}

function StudentHome() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/me/enrollments').then((d) => { setList(d.enrollments); if (d.enrollments[0]) setOpen(d.enrollments[0].id); }).catch((e) => setErr(e.message)); }, []);

  async function toggle(enr, lessonId) {
    try {
      const r = await api(`/me/enrollments/${enr.id}/lessons/${lessonId}`, { method: 'POST' });
      setList((l) => l.map((x) => (x.id === enr.id ? { ...x, completed: r.completed } : x)));
    } catch (e) { setErr(e.message); }
  }

  if (!list) return err ? <Alert>{err}</Alert> : <div className="spinner" />;
  const activeList = list.filter((e) => e.status === 'active');
  const done = activeList.reduce((a, e) => a + e.completed.length, 0);
  const total = activeList.reduce((a, e) => a + e.course.lessonCount, 0);

  return (
    <>
      <div className="dash-head"><div><h1>Hi {user.name.split(' ')[0]}</h1><p className="muted">Here are your classes and lessons.</p></div><Link to="/courses" className="btn btn-primary">Find a course</Link></div>
      <Alert>{err}</Alert>
      <div className="stats">
        <div className="stat"><span>Active courses</span><strong>{activeList.length}</strong></div>
        <div className="stat"><span>Lessons completed</span><strong>{done} / {total}</strong></div>
        <div className="stat"><span>Overall progress</span><strong>{total ? Math.round((done / total) * 100) : 0}%</strong></div>
      </div>
      {list.length === 0 && <Empty title="You have not joined a course yet">Browse the catalog and enroll in a class to unlock its lessons. <br /><br /><Link to="/courses" className="btn btn-primary">Browse courses</Link></Empty>}
      <div className="enr-list">
        {list.map((e) => {
          const pct = e.course.lessonCount ? Math.round((e.completed.length / e.course.lessonCount) * 100) : 0;
          return (
            <article key={e.id} className="card enr">
              <button className="enr-head" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
                <Img src={e.course.image} alt="" className="enr-img" />
                <div className="enr-info">
                  <h3>{e.course.title}</h3>
                  <p className="muted">{e.course.instructor?.name} · {e.course.schedule}</p>
                  {e.status === 'active' ? <div className="bar"><span style={{ width: `${pct}%` }} /></div> : <span className="tag tag-warn">Payment pending</span>}
                </div>
                <span className="pct">{e.status === 'active' ? `${pct}%` : ''}</span>
              </button>
              {open === e.id && (e.status === 'active' ? (
                <ol className="lessons compact">
                  {e.course.lessons.map((l, i) => {
                    const checked = e.completed.includes(l.id);
                    return (
                      <li key={l.id} className={checked ? 'done' : ''}>
                        <label className="lesson-top"><input type="checkbox" checked={checked} onChange={() => toggle(e, l.id)} /><span className="num">{String(i + 1).padStart(2, '0')}</span><strong>{l.title}</strong><span className="dur">{l.duration} min</span></label>
                        <p>{l.summary}</p>
                        {l.videoUrl && <a href={l.videoUrl} target="_blank" rel="noreferrer">Watch recording</a>}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="enr-pending"><p>Your seat is held while payment is pending.</p><Link to={`/courses/${e.course.slug}`} className="btn btn-primary btn-sm">Complete payment ({pkr(e.amount)})</Link></div>
              ))}
            </article>
          );
        })}
      </div>
      {list.some((e) => e.paidAt) && <p className="fineprint">Last payment: {date(list.filter((e) => e.paidAt).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0].paidAt)}</p>}
    </>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name || '', phone: user.phone || '', grade: user.grade || '', bio: user.bio || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e, body) {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    try { const d = await api('/auth/me', { method: 'PATCH', body }); setUser(d.user); setMsg({ ok: 'Saved.', err: '' }); setPw({ currentPassword: '', newPassword: '' }); } catch (e2) { setMsg({ ok: '', err: e2.message }); }
  }

  return (
    <>
      <div className="dash-head"><div><h1>Profile</h1><p className="muted">{user.email}</p></div></div>
      <Alert>{msg.err}</Alert><Alert kind="ok">{msg.ok}</Alert>
      <div className="grid2 top">
        <form className="card form" onSubmit={(e) => save(e, f)}>
          <h3>Your details</h3>
          <label>Name<input value={f.name} onChange={on('name')} required /></label>
          <label>Phone<input value={f.phone} onChange={on('phone')} /></label>
          {user.role === 'student' && <label>Class / grade<input value={f.grade} onChange={on('grade')} /></label>}
          {user.role !== 'student' && <label>Short bio<textarea rows="4" value={f.bio} onChange={on('bio')} /></label>}
          <button className="btn btn-primary">Save details</button>
        </form>
        <form className="card form" onSubmit={(e) => save(e, pw)}>
          <h3>Change password</h3>
          <label>Current password<input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></label>
          <label>New password<input type="password" autoComplete="new-password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></label>
          <button className="btn btn-light">Update password</button>
        </form>
      </div>
    </>
  );
}
