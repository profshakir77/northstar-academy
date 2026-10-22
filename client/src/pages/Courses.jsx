import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSeo } from '../seo.js';
import { CourseCard, Empty } from '../components/ui.jsx';

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState({ levels: [], subjects: [] });
  const [courses, setCourses] = useState(null);
  const [q, setQ] = useState(params.get('q') || '');
  const filters = { level: params.get('level') || '', subject: params.get('subject') || '', mode: params.get('mode') || '', q: params.get('q') || '' };

  const lvl = filters.level;
  useSeo({
    title: lvl ? `${lvl} Tuition Classes` : 'Courses: Matric, FSc, O & A Level Tuition',
    description: lvl ? `${lvl} tuition in Islamabad and online. Small groups, weekly tests and past-paper practice. See fees, timings and teachers.` : 'Browse tuition courses for Grade 6 to A Level in Islamabad and online: Maths, Physics, Chemistry, Biology, Computer Science and English. Fees and timings on every course.',
    path: lvl ? `/courses?level=${encodeURIComponent(lvl)}` : '/courses',
  });

  useEffect(() => { api('/courses/meta').then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    setCourses(null);
    api('/courses', { query: filters }).then((d) => setCourses(d.courses)).catch(() => setCourses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };

  return (
    <>
      <section className="page-hero"><div className="container"><span className="eyebrow">Course catalog</span><h1>Find the right class</h1><p className="lead">Filter by level, subject or how you want to attend. Every course includes weekly tests and access to the student portal.</p></div></section>
      <section className="section tight">
        <div className="container">
          <form className="filters" onSubmit={(e) => { e.preventDefault(); set('q', q.trim()); }}>
            <input type="search" placeholder="Search courses, e.g. physics" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search courses" />
            <select value={filters.level} onChange={(e) => set('level', e.target.value)} aria-label="Level"><option value="">All levels</option>{meta.levels.map((l) => <option key={l}>{l}</option>)}</select>
            <select value={filters.subject} onChange={(e) => set('subject', e.target.value)} aria-label="Subject"><option value="">All subjects</option>{meta.subjects.map((s) => <option key={s}>{s}</option>)}</select>
            <select value={filters.mode} onChange={(e) => set('mode', e.target.value)} aria-label="Mode"><option value="">Any mode</option><option>Online</option><option>On campus</option><option>Hybrid</option></select>
            <button className="btn btn-primary">Search</button>
          </form>
          {courses && <p className="muted count">{courses.length} course{courses.length === 1 ? '' : 's'} found{params.toString() && <> · <button type="button" className="linkish" onClick={() => { setQ(''); setParams({}); }}>Clear filters</button></>}</p>}
          <div className="course-grid">
            {courses === null ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card skeleton" />) : courses.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
          {courses?.length === 0 && <Empty title="No courses match those filters">Try another subject or level, or ask the office about upcoming batches.</Empty>}
        </div>
      </section>
    </>
  );
}
