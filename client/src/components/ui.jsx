import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pkr } from '../api.js';

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#16365c"/><stop offset="1" stop-color="#0f2a4a"/></linearGradient></defs><rect width="600" height="360" fill="url(#g)"/><path d="M300 120l10 26 26 10-26 10-10 26-10-26-26-10 26-10z" fill="#f2a93b"/></svg>');

export function Img({ src, alt, ...rest }) {
  const [s, setS] = useState(src || FALLBACK);
  return <img src={s} alt={alt} loading="lazy" onError={() => setS(FALLBACK)} {...rest} />;
}

export function CourseCard({ c }) {
  return (
    <Link to={`/courses/${c.slug}`} className="card course-card">
      <div className="thumb">
        <Img src={c.image} alt={c.title} />
        <span className="chip chip-level">{c.level}</span>
        {c.featured && <span className="chip chip-hot">Popular</span>}
      </div>
      <div className="body">
        <div className="meta"><span>{c.subject}</span><span>·</span><span>{c.mode}</span></div>
        <h3>{c.title}</h3>
        <p>{c.summary}</p>
        <div className="foot">
          <span className="teacher">{c.instructor?.name}</span>
          <strong className="price">{pkr(c.price)}<small>{c.price ? ' / course' : ''}</small></strong>
        </div>
      </div>
    </Link>
  );
}

export const Initials = ({ name, size = 56 }) => {
  const i = (name || '?').replace(/^Dr\.?\s+/, '').split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{i}</span>;
};

export const Alert = ({ kind = 'error', children }) => (children ? <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> : null);

export const Empty = ({ title, children }) => (<div className="empty"><h3>{title}</h3>{children}</div>);
