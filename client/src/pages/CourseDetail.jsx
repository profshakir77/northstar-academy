import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, date, pkr } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Img, Initials } from '../components/ui.jsx';

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(new URLSearchParams(loc.search).get('payment') === 'cancelled' ? 'Payment was cancelled. You have not been charged.' : '');

  const load = () => api(`/courses/${slug}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { setData(null); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug, user?.id]);
  useEffect(() => { if (data?.course) document.title = `${data.course.title} | Northstar Tuition Academy`; }, [data]);

  if (err) return <div className="container page"><Alert>{err}</Alert><Link to="/courses">Back to courses</Link></div>;
  if (!data) return <div className="container page"><div className="spinner" /></div>;
  const { course: c, enrollment } = data;
  const active = enrollment?.status === 'active';

  async function enroll() {
    setErr(''); setNote('');
    if (!user) return nav(`/login?next=${encodeURIComponent(loc.pathname)}`);
    if (user.role !== 'student') return setNote('Only student accounts can enroll. Sign in with a student account to try this.');
    setBusy(true);
    try {
      const r = await api('/enroll', { method: 'POST', body: { courseId: c.id } });
      if (r.status === 'checkout') { window.location.href = r.url; return; }
      setNote(r.demo ? 'You are enrolled. (Demo mode: no real payment was taken.)' : 'You are enrolled.');
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const totalMin = (c.lessons || []).reduce((a, l) => a + (l.duration || 0), 0);

  return (
    <>
      <section className="course-hero">
        <div className="container course-hero-grid">
          <div>
            <nav className="crumbs"><Link to="/courses">Courses</Link> / <Link to={`/courses?level=${encodeURIComponent(c.level)}`}>{c.level}</Link></nav>
            <h1>{c.title}</h1>
            <p className="lead">{c.summary}</p>
            <ul className="facts">
              <li><span>Subject</span>{c.subject}</li>
              <li><span>Mode</span>{c.mode}</li>
              <li><span>Schedule</span>{c.schedule}</li>
              <li><span>Starts</span>{date(c.startDate)}</li>
            </ul>
          </div>
          <aside className="card buy-card">
            <Img src={c.image} alt={c.title} className="buy-img" />
            <div className="buy-body">
              <div className="price-lg">{pkr(c.price)}</div>
              <p className="muted">{c.lessonCount} lessons · about {Math.round(totalMin / 60)} hours · {c.seatsLeft} seats left</p>
              <Alert>{err}</Alert>
              <Alert kind="ok">{note}</Alert>
              {active ? (
                <Link to="/dashboard" className="btn btn-primary btn-block">Go to my classes</Link>
              ) : enrollment?.status === 'pending' ? (
                <button className="btn btn-primary btn-block" onClick={enroll} disabled={busy}>{busy ? 'Please wait…' : 'Complete payment'}</button>
              ) : (
                <button className="btn btn-primary btn-block" onClick={enroll} disabled={busy || c.seatsLeft === 0}>{c.seatsLeft === 0 ? 'Class full' : busy ? 'Please wait…' : user ? 'Enroll now' : 'Sign in to enroll'}</button>
              )}
              <p className="fineprint">Card payments run in Stripe test mode on this demo. Use card 4242 4242 4242 4242.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section tight">
        <div className="container course-body">
          <div>
            <h2>About this course</h2>
            {(c.description || '').split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            {c.outcomes?.length > 0 && (<><h2>What you get</h2><ul className="ticks">{c.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></>)}
            <h2>Lesson plan</h2>
            <ol className="lessons">
              {c.lessons.map((l, i) => (
                <li key={l.id} className={l.summary ? 'open' : 'locked'}>
                  <div className="lesson-top"><span className="num">{String(i + 1).padStart(2, '0')}</span><strong>{l.title}</strong>{l.free && !active && <span className="tag tag-ok">Free preview</span>}<span className="dur">{l.duration} min</span></div>
                  {l.summary ? <p>{l.summary}</p> : <p className="muted">🔒 Unlocks after enrollment</p>}
                </li>
              ))}
            </ol>
          </div>
          {c.instructor && (
            <aside className="card instructor-card">
              <span className="eyebrow">Your teacher</span>
              <div className="ins-row"><Initials name={c.instructor.name} /><div><h3>{c.instructor.name}</h3><p className="muted">{c.instructor.qualification}</p></div></div>
              <p>{c.instructor.bio}</p>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
