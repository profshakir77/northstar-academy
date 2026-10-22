import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSeo } from '../seo.js';
import { CourseCard, Img, Initials } from '../components/ui.jsx';

const u = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const levels = [
  ['Grade 6-8', 'Catching up or getting ahead in maths, science and English before board classes start.'],
  ['Matric (9-10)', 'Federal and Punjab Board syllabus, chapter tests and five years of past papers.'],
  ['FSc / ICS (11-12)', 'Pre-medical, pre-engineering and ICS, with MDCAT and ECAT style practice.'],
  ['O Level', 'Cambridge syllabus taught topic by topic, then drilled with topical past papers.'],
  ['A Level', 'Fewer students per class, full mock exams and time for one-to-one questions.'],
];

const reasons = [
  ['Classes stay small', 'A batch closes at 25 students and most are smaller. The teacher learns every name in the first week.'],
  ['A test every Saturday', 'Twenty minutes, marked and returned by Monday. Problems show up in week three, not in the board exam.'],
  ['Parents hear from us', 'A short report every month, and a call from the class teacher once a term. You never have to chase us.'],
  ['Missed a class?', 'Notes and the recording go up in the student portal the same evening, so nobody falls behind for a fever or a wedding.'],
];

const voices = [
  ['Our son used to freeze in maths tests. A term with Miss Ayesha and he now asks for extra worksheets. The Saturday tests took the fear out of it.', 'Parent of a Class 10 student'],
  ['Sir Usman explains physics like a story. For the first time I understand why a formula works, not just where to plug numbers in.', 'FSc Part II student'],
  ['We wrote Python every week in O Level CS. By May the past papers felt like more of the same homework.', 'O Level student'],
];

const faqs = [
  ['How much are the fees?', 'Fees are per course and shown on every course page, from Rs 9,000 for Grade 6-8 to Rs 32,000 for A Level. A second sibling gets 10% off, and we offer concessions to students who need them.'],
  ['Can my child try a class before we pay?', 'Yes. Book a free trial class from the Admissions page. We also do a short placement test so your child joins a group at the right pace.'],
  ['Do you teach online as well as on campus?', 'Both. Each course is marked Online, On campus or Hybrid. Online classes are live, not recorded lectures, and the recording is shared afterwards.'],
  ['Which boards and syllabuses do you cover?', 'Federal Board and Punjab Board for Matric and FSc, and Cambridge for O and A Level. ICS students are covered for Computer Science too.'],
  ['How will I know if my child is improving?', 'Every Saturday test is marked and stored in the student portal. Parents get a monthly report and can log in at any time to see progress.'],
  ['What timings do classes run at?', 'Weekday batches run between 3:30 pm and 9 pm, so school students can come straight after school. Weekend batches start at 11 am.'],
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [meta, setMeta] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useSeo({
    description: 'Small-group tuition in Islamabad and online for Grade 6, Matric, FSc / ICS, O Level and A Level. Maths, Physics, Chemistry, Biology, Computer Science and English, with a test every week.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  });

  useEffect(() => {
    api('/courses', { query: { featured: 'true' } }).then((d) => setFeatured(d.courses.slice(0, 6))).catch(() => {});
    api('/courses/meta').then(setMeta).catch(() => {});
    api('/instructors').then((d) => setTeachers(d.instructors.slice(0, 4))).catch(() => {});
  }, []);

  const totalCourses = meta ? Object.values(meta.levelCounts).reduce((a, b) => a + b, 0) : 9;

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Tuition academy in Islamabad · Classes online too</span>
            <h1>Good results are built <em>one week</em> at a time.</h1>
            <p className="lead">Northstar is a tuition academy for students from Grade 6 to A Level. We keep classes small, test every Saturday and tell parents how things are going before they have to ask.</p>
            <div className="hero-cta">
              <Link to="/courses" className="btn btn-primary btn-lg">See this term’s courses</Link>
              <Link to="/admissions" className="btn btn-light btn-lg">Book a free trial class</Link>
            </div>
            <ul className="hero-stats">
              <li><strong>{totalCourses}</strong><span>courses this term</span></li>
              <li><strong>{meta ? meta.teachers : 5}</strong><span>subject teachers</span></li>
              <li><strong>25</strong><span>students per class, at most</span></li>
            </ul>
          </div>
          <div className="hero-art">
            <Img src={u('photo-1522202176988-66273c2fd55f', 1100)} alt="Students working through problems together at a study table" className="hero-img" />
            <div className="float-card timetable fc-2">
              <strong>Today’s timetable</strong>
              <ul className="week">
                <li><span>Matric Maths</span><b>4:00 pm</b></li>
                <li><span>FSc Physics</span><b>5:00 pm</b></li>
                <li><span>FSc Chemistry</span><b>6:00 pm</b></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">What we teach</span><h2>Tuition for every stage of school</h2></div>
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
          <div className="section-head row"><div><span className="eyebrow">Filling up first</span><h2>The courses parents ask about most</h2></div><Link to="/courses" className="btn btn-ghost">All courses</Link></div>
          <div className="course-grid">{featured.length ? featured.map((c) => <CourseCard key={c.id} c={c} />) : Array.from({ length: 3 }).map((_, i) => <div key={i} className="card skeleton" />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Img src={u('photo-1577896851231-70ef18881754', 1000)} alt="A teacher sitting with a student and going through her notebook" className="rounded-img" />
          <div>
            <span className="eyebrow">How we work</span>
            <h2>Nothing clever. Just steady, checked progress.</h2>
            <div className="reason-grid">{reasons.map(([t, d]) => <div key={t} className="reason"><h3>{t}</h3><p>{d}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head row"><div><span className="eyebrow">Our teachers</span><h2>The people your child will learn from</h2></div><Link to="/teachers" className="btn btn-ghost">Meet them all</Link></div>
          <div className="teacher-grid">
            {teachers.map((t) => (
              <div key={t.id} className="card teacher-card"><Initials name={t.name} /><h3>{t.name}</h3><p className="muted">{t.qualification}</p><div className="tags">{t.subjects.map((s) => <span key={s} className="tag">{s}</span>)}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">In their words</span><h2>What students and parents tell us</h2></div>
          <div className="quote-grid">{voices.map(([q, who]) => <figure key={who} className="quote"><blockquote>“{q}”</blockquote><figcaption>{who}</figcaption></figure>)}</div>
          <p className="fineprint">These are sample testimonials written for this demo website.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="container faq">
          <div className="section-head"><span className="eyebrow">Questions parents ask</span><h2>Before you enroll</h2></div>
          {faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <div><h2>Sit in on a class first</h2><p>Book a free trial in any subject. Your child joins a real class, and we suggest the right group afterwards.</p></div>
          <Link to="/admissions" className="btn btn-primary btn-lg">Book a free trial</Link>
        </div>
      </section>
    </>
  );
}
