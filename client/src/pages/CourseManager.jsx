import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, date, pkr } from '../api.js';
import { Alert, Empty, Img } from '../components/ui.jsx';

const LEVELS = ['Grade 6-8', 'Matric (9-10)', 'FSc / ICS (11-12)', 'O Level', 'A Level'];
const blank = { title: '', subject: '', level: 'Matric (9-10)', board: 'Federal Board', summary: '', description: '', image: '', price: 10000, mode: 'Hybrid', schedule: '', startDate: '', seats: 25, outcomes: [], lessons: [], published: false, featured: false, instructorId: '' };

export default function CourseManager({ admin = false }) {
  const [courses, setCourses] = useState(null);
  const [editing, setEditing] = useState(null);
  const [roster, setRoster] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  const load = () => api('/manage/courses').then((d) => setCourses(d.courses)).catch((e) => setMsg({ ok: '', err: e.message }));
  useEffect(() => { load(); if (admin) api('/admin/users', { query: { role: 'instructor' } }).then((d) => setTeachers(d.users)).catch(() => {}); }, [admin]);

  async function remove(c) {
    if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    try { await api(`/manage/courses/${c.id}`, { method: 'DELETE' }); setMsg({ ok: 'Course deleted.', err: '' }); load(); } catch (e) { setMsg({ ok: '', err: e.message }); }
  }
  async function showRoster(c) {
    setRoster({ course: c, list: null });
    try { const d = await api(`/manage/courses/${c.id}/students`); setRoster({ course: c, list: d.students }); } catch (e) { setMsg({ ok: '', err: e.message }); setRoster(null); }
  }

  if (editing) return <CourseEditor initial={editing} admin={admin} teachers={teachers} onDone={(saved) => { setEditing(null); if (saved) { setMsg({ ok: 'Course saved.', err: '' }); load(); } }} />;

  return (
    <>
      <div className="dash-head"><div><h1>{admin ? 'All courses' : 'My courses'}</h1><p className="muted">Create courses, plan lessons and see who has joined.</p></div><button className="btn btn-primary" onClick={() => setEditing(blank)}>New course</button></div>
      <Alert>{msg.err}</Alert><Alert kind="ok">{msg.ok}</Alert>
      {courses && (
        <div className="stats">
          <div className="stat"><span>Courses</span><strong>{courses.length}</strong></div>
          <div className="stat"><span>Published</span><strong>{courses.filter((c) => c.published).length}</strong></div>
          <div className="stat"><span>Enrolled students</span><strong>{courses.reduce((a, c) => a + c.students, 0)}</strong></div>
        </div>
      )}
      {courses === null ? <div className="spinner" /> : courses.length === 0 ? <Empty title="No courses yet">Click “New course” to create your first one.</Empty> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Course</th>{admin && <th>Teacher</th>}<th>Level</th><th>Fee</th><th>Students</th><th>Status</th><th /></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><div className="cell-course"><Img src={c.image} alt="" /><div><Link to={`/courses/${c.slug}`}>{c.title}</Link><small className="muted">{c.lessonCount} lessons · {c.mode}</small></div></div></td>
                  {admin && <td>{c.instructor?.name}</td>}
                  <td>{c.level}</td>
                  <td>{pkr(c.price)}</td>
                  <td>{c.students} / {c.seats}</td>
                  <td>{c.published ? <span className="tag tag-ok">Published</span> : <span className="tag">Draft</span>}{c.featured && <span className="tag tag-hot">Featured</span>}</td>
                  <td className="actions">
                    <button className="btn btn-light btn-sm" onClick={() => setEditing({ ...blank, ...c, startDate: c.startDate ? c.startDate.slice(0, 10) : '', instructorId: c.instructor?.id || '' })}>Edit</button>
                    <button className="btn btn-light btn-sm" onClick={() => showRoster(c)}>Students</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {roster && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRoster(null)}>
          <div className="card modal-card">
            <div className="dash-head"><h2>{roster.course.title}</h2><button className="btn btn-light btn-sm" onClick={() => setRoster(null)}>Close</button></div>
            {roster.list === null ? <div className="spinner" /> : roster.list.length === 0 ? <p className="muted">No students yet.</p> : (
              <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Grade</th><th>Status</th><th>Progress</th><th>Joined</th></tr></thead>
                <tbody>{roster.list.map((s) => <tr key={s.enrollmentId}><td>{s.name}</td><td>{s.email}</td><td>{s.grade}</td><td>{s.status}</td><td><div className="bar sm"><span style={{ width: `${s.progress}%` }} /></div>{s.progress}%</td><td>{date(s.joined)}</td></tr>)}</tbody></table></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CourseEditor({ initial, admin, teachers, onDone }) {
  const [f, setF] = useState({ ...initial, outcomesText: (initial.outcomes || []).join('\n') });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const on = (k, cast = (v) => v) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : cast(e.target.value) });
  const setLesson = (i, k, v) => setF({ ...f, lessons: f.lessons.map((l, j) => (j === i ? { ...l, [k]: v } : l)) });
  const move = (i, d) => { const ls = [...f.lessons]; const j = i + d; if (j < 0 || j >= ls.length) return; [ls[i], ls[j]] = [ls[j], ls[i]]; setF({ ...f, lessons: ls }); };

  async function save(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const body = {
      title: f.title, subject: f.subject, level: f.level, board: f.board, summary: f.summary, description: f.description, image: f.image,
      price: Number(f.price), mode: f.mode, schedule: f.schedule, seats: Number(f.seats), published: !!f.published,
      outcomes: f.outcomesText.split('\n').map((s) => s.trim()).filter(Boolean),
      lessons: f.lessons.map((l) => ({ id: l.id, title: l.title, duration: Number(l.duration) || 45, summary: l.summary || '', videoUrl: l.videoUrl || '', free: !!l.free })),
      ...(f.startDate ? { startDate: f.startDate } : {}),
      ...(admin ? { featured: !!f.featured, ...(f.instructorId ? { instructorId: f.instructorId } : {}) } : {}),
    };
    try {
      await api(f.id ? `/manage/courses/${f.id}` : '/manage/courses', { method: f.id ? 'PUT' : 'POST', body });
      onDone(true);
    } catch (e2) { setErr(e2.message); setBusy(false); window.scrollTo(0, 0); }
  }

  return (
    <form className="editor" onSubmit={save}>
      <div className="dash-head"><div><h1>{f.id ? 'Edit course' : 'New course'}</h1><p className="muted">Draft courses are only visible to you until you publish them.</p></div><div className="row-gap"><button type="button" className="btn btn-light" onClick={() => onDone(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save course'}</button></div></div>
      <Alert>{err}</Alert>
      <div className="card form">
        <h3>Basics</h3>
        <label>Title<input required minLength={4} value={f.title} onChange={on('title')} /></label>
        <div className="grid3">
          <label>Subject<input required value={f.subject} onChange={on('subject')} placeholder="e.g. Physics" /></label>
          <label>Level<select value={f.level} onChange={on('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
          <label>Board<input value={f.board || ''} onChange={on('board')} /></label>
          <label>Fee (PKR)<input type="number" min="0" value={f.price} onChange={on('price')} /></label>
          <label>Seats<input type="number" min="1" max="500" value={f.seats} onChange={on('seats')} /></label>
          <label>Mode<select value={f.mode} onChange={on('mode')}><option>Online</option><option>On campus</option><option>Hybrid</option></select></label>
          <label>Schedule<input value={f.schedule || ''} onChange={on('schedule')} placeholder="Mon, Wed · 4 to 5:30 pm" /></label>
          <label>Start date<input type="date" value={f.startDate || ''} onChange={on('startDate')} /></label>
          {admin && <label>Teacher<select value={f.instructorId || ''} onChange={on('instructorId')}><option value="">(me)</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
        </div>
        <label>Cover image URL<input type="url" value={f.image || ''} onChange={on('image')} placeholder="https://images.unsplash.com/..." /></label>
        {f.image && <Img src={f.image} alt="Cover preview" className="cover-preview" />}
        <label>Short summary<input maxLength={300} value={f.summary || ''} onChange={on('summary')} /></label>
        <label>Description<textarea rows="5" value={f.description || ''} onChange={on('description')} /></label>
        <label>What students get (one per line)<textarea rows="4" value={f.outcomesText} onChange={on('outcomesText')} /></label>
        <div className="checks">
          <label className="check"><input type="checkbox" checked={!!f.published} onChange={on('published')} /> Published</label>
          {admin && <label className="check"><input type="checkbox" checked={!!f.featured} onChange={on('featured')} /> Featured on home page</label>}
        </div>
      </div>
      <div className="card form">
        <div className="dash-head"><h3>Lessons ({f.lessons.length})</h3><button type="button" className="btn btn-light btn-sm" onClick={() => setF({ ...f, lessons: [...f.lessons, { title: '', duration: 45, summary: '', videoUrl: '', free: false }] })}>Add lesson</button></div>
        {f.lessons.length === 0 && <p className="muted">No lessons yet.</p>}
        {f.lessons.map((l, i) => (
          <div key={l.id || i} className="lesson-edit">
            <div className="lesson-edit-top">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <input required minLength={2} placeholder="Lesson title" value={l.title} onChange={(e) => setLesson(i, 'title', e.target.value)} aria-label="Lesson title" />
              <input type="number" min="5" max="300" value={l.duration} onChange={(e) => setLesson(i, 'duration', e.target.value)} aria-label="Minutes" className="mins" />
              <label className="check"><input type="checkbox" checked={!!l.free} onChange={(e) => setLesson(i, 'free', e.target.checked)} /> Free</label>
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" className="icon-btn" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button type="button" className="icon-btn danger" onClick={() => setF({ ...f, lessons: f.lessons.filter((_, j) => j !== i) })} aria-label="Remove lesson">✕</button>
            </div>
            <textarea rows="2" placeholder="What this lesson covers" value={l.summary || ''} onChange={(e) => setLesson(i, 'summary', e.target.value)} />
            <input type="url" placeholder="Recording URL (optional)" value={l.videoUrl || ''} onChange={(e) => setLesson(i, 'videoUrl', e.target.value)} />
          </div>
        ))}
      </div>
    </form>
  );
}
