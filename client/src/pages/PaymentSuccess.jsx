import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Alert } from '../components/ui.jsx';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, err: '', course: null });
  useEffect(() => {
    const id = params.get('session_id');
    if (!id) { setState({ loading: false, err: 'Missing payment reference.', course: null }); return; }
    api('/payments/confirm', { query: { session_id: id } })
      .then((d) => setState({ loading: false, err: '', course: d.course }))
      .catch((e) => setState({ loading: false, err: e.message, course: null }));
  }, [params]);

  return (
    <div className="container page center narrow">
      {state.loading ? <div className="spinner" /> : state.err ? (
        <><h1>We could not confirm the payment</h1><Alert>{state.err}</Alert><Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link></>
      ) : (
        <><div className="big-check">✓</div><h1>Payment received</h1><p className="lead">You are now enrolled in <strong>{state.course.title}</strong>. Your lessons are unlocked.</p><Link to="/dashboard" className="btn btn-primary">Start learning</Link></>
      )}
    </div>
  );
}
