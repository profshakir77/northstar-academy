import { useSeo } from '../seo.js';
import { Link } from 'react-router-dom';
export default function NotFound() {
  useSeo({ title: 'Page not found', noindex: true });
  return <div className="container page center"><h1>Page not found</h1><p className="muted">The page you were looking for does not exist.</p><Link to="/" className="btn btn-primary">Back to home</Link></div>;
}
