import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSeo } from '../seo.js';
import { Initials } from '../components/ui.jsx';

export default function Teachers() {
  const [list, setList] = useState(null);
  useSeo({ title: 'Our Teachers', description: 'Meet the subject teachers at Northstar Tuition Academy in Islamabad: Maths, Physics, Chemistry, Biology, Computer Science and English, each with 6 or more years in the classroom.', path: '/teachers' });
  useEffect(() => { api('/instructors').then((d) => setList(d.instructors)).catch(() => setList([])); }, []);
  return (
    <>
      <section className="page-hero"><div className="container"><span className="eyebrow">Faculty</span><h1>Teachers who explain it, then check it stuck</h1><p className="lead">Every teacher here has spent at least six years in a classroom and teaches the subject they studied. They write their own Saturday tests, so the test matches what was taught that week.</p></div></section>
      <section className="section tight">
        <div className="container teacher-grid lg">
          {(list || []).map((t) => (
            <article key={t.id} className="card teacher-card">
              <Initials name={t.name} size={72} />
              <h3>{t.name}</h3>
              <p className="muted">{t.qualification}</p>
              <p>{t.bio}</p>
              <div className="tags">{t.subjects.map((s) => <Link key={s} to={`/courses?subject=${encodeURIComponent(s)}`} className="tag">{s}</Link>)}</div>
              <p className="muted small">{t.courses} course{t.courses === 1 ? '' : 's'} this term</p>
            </article>
          ))}
          {list === null && Array.from({ length: 4 }).map((_, i) => <div key={i} className="card skeleton" />)}
        </div>
      </section>
    </>
  );
}
