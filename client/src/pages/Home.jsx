import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { CourseCard, Img, Initials } from '../components/ui.jsx';

const u = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const levels = [
  ['Grade 6-8', 'Strong basics in maths, science and English.'],
  ['Matric (9-10)', 'Board syllabus, weekly tests and past papers.'],
  ['FSc / ICS (11-12)', 'Pre-medical, pre-engineering and ICS.'],
  ['O Level', 'Cambridge syllabus with topical past papers.'],
  ['A Level', 'Exam-focused classes and full mock exams.'],
];

const reasons = [
  ['Small classes', 'Never more than 25 students, and most groups are smaller. Teachers know every name.'],
  ['Weekly tests', 'A short timed test every week, marked within two days, so gaps show up early.'],
  ['Parent reports', 'A monthly progress report and a call with the class teacher every term.'],
  ['Recorded classes', 'Notes and recordings go up in the student portal after each class.'],
];

const voices = [
  ['Our son was scared of maths. After one term with Miss Ayesha he asks for extra worksheets. The weekly tests made the difference.', 'Parent of a Class 10 student'],
  ['Sir Usman explains physics like a story. I finally understand why the formulas work, not just how to use them.', 'FSc Part II student'],
  ['The O Level CS classes were very practical. We wrote Python every single week and the past papers felt easy by May.', 'O Level student'],
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [meta, setMeta] = useState(null);
  const [teachers, setTeachers] = useState([]);
  useEffect(() => {
    api('/courses', { query: { featured: 'true' } }).then((d) => setFeatured(d.courses.slice(0, 6))).catch(() => {});
    api('/courses/meta').then(setMeta).catch(() => {});
    api('/instructors').then((d) => setTeachers(d.instructors.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Grade 6 to A Level · Islamabad and online</span>
            <h1>Better grades come from <em>steady</em> weekly progress.</h1>
            <p className="lead">Northstar is a tuition academy for school and college students. Small classes, experienced teachers, a test every week and a report for parents every month.</p>
            <div className="hero-cta">
              <Link to="/courses" className="btn btn-primary btn-lg">Browse courses</Link>
              <Link to="/admissions" className="btn btn-light btn-lg">Book a free trial class</Link>
            </div>
            <ul className="hero-stats">
              <li><strong>{meta ? meta.levels.length : 5}</strong><span>levels taught</span></li>
              <li><strong>{meta ? Object.values(meta.levelCounts).reduce((a, b) => a + b, 0) : 9}+</strong><span>courses running</span></li>
              <li><strong>25</strong><span>max class size</span></li>
            </ul>
          </div>
          <div className="hero-art">
            <Img src={u('photo-1522202176988-66273c2fd55f', 1100)} alt="Students studying together around a table" className="hero-img" />
            <div className="float-card fc-1"><span className="dot ok" /> Weekly test marked <strong>18 / 20</strong></div>
            <div className="float-card fc-2"><strong>Next class</strong><span>FSc Physics · 5:00 pm</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Programs</span><h2>Classes for every stage of school</h2></div>
          <div className="level-grid">
            {levels.map(([l, d]) => (
              <Link key={l} to={`/courses?level=${encodeURIComponent(l)}`} className="level-card">
                <h3>{l}</h3><p>{d}</p>
                <span className="more">{meta?.levelCounts?.[l] || 0} course{meta?.levelCounts?.[l] === 1 ? '' : 's'} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head row"><div><span className="eyebrow">Popular this term</span><h2>Courses parents ask about most</h2></div><Link to="/courses" className="btn btn-ghost">All courses</Link></div>
          <div className="course-grid">{featured.length ? featured.map((c) => <CourseCard key={c.id} c={c} />) : Array.from({ length: 3 }).map((_, i) => <div key={i} className="card skeleton" />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Img src={u('photo-1577896851231-70ef18881754', 1000)} alt="Teacher helping a student in class" className="rounded-img" />
          <div>
            <span className="eyebrow">Why Northstar</span>
            <h2>Teaching that parents can see working</h2>
            <div className="reason-grid">{reasons.map(([t, d]) => <div key={t} className="reason"><h3>{t}</h3><p>{d}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head row"><div><span className="eyebrow">Faculty</span><h2>Meet some of our teachers</h2></div><Link to="/teachers" className="btn btn-ghost">All teachers</Link></div>
          <div className="teacher-grid">
            {teachers.map((t) => (
              <div key={t.id} className="card teacher-card"><Initials name={t.name} /><h3>{t.name}</h3><p className="muted">{t.qualification}</p><div className="tags">{t.subjects.map((s) => <span key={s} className="tag">{s}</span>)}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Families say</span><h2>What students and parents tell us</h2></div>
          <div className="quote-grid">{voices.map(([q, who]) => <figure key={who} className="quote"><blockquote>“{q}”</blockquote><figcaption>{who}</figcaption></figure>)}</div>
          <p className="fineprint">Sample testimonials for this demo website.</p>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <div><h2>Try a class before you pay</h2><p>Book a free trial class in any subject. We will also do a short placement test so your child joins the right group.</p></div>
          <Link to="/admissions" className="btn btn-primary btn-lg">Book a free trial</Link>
        </div>
      </section>
    </>
  );
}
