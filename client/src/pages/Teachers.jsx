import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Initials } from '../components/ui.jsx';

export default function Teachers() {
  const [list, setList] = useState(null);
  useEffect(() => { document.title = 'Our Teachers | Northstar Tuition Academy'; api('/instructors').then((d) => setList(d.instructors)).catch(() => setList([])); }, []);
  return (
    <>
      <section className="page-hero"><div className="container"><span className="eyebrow">Faculty</span><h1>Teachers who explain, then check</h1><p className="lead">Every teacher has at least five years of classroom experience and teaches the subject they studied. They write the weekly tests themselves.</p></div></section>
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
