import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Img } from '../components/ui.jsx';

const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;

export default function About() {
  useEffect(() => { document.title = 'About | Northstar Tuition Academy'; }, []);
  return (
    <>
      <section className="page-hero"><div className="container"><span className="eyebrow">About us</span><h1>A small academy with a simple method</h1><p className="lead">Explain the idea clearly, practise it the same week, test it on Saturday, and tell parents how it went.</p></div></section>
      <section className="section tight">
        <div className="container split">
          <div>
            <h2>How a week works</h2>
            <ol className="steps">
              <li><strong>Class.</strong> The teacher explains one topic with worked examples, then students try questions in class.</li>
              <li><strong>Practice.</strong> A short worksheet goes home. Recordings and notes go up in the student portal the same evening.</li>
              <li><strong>Test.</strong> A 20-minute test at the end of the week, marked within two days.</li>
              <li><strong>Report.</strong> Results feed into a monthly report that parents receive by email.</li>
            </ol>
            <Link to="/admissions" className="btn btn-primary">Talk to admissions</Link>
          </div>
          <Img src={u('photo-1580582932707-520aed937b7b')} alt="Classroom with desks and a whiteboard" className="rounded-img" />
        </div>
      </section>
      <section className="section alt">
        <div className="container gallery">
          <Img src={u('photo-1524178232363-1fb2b075b655')} alt="Students in a lecture" />
          <Img src={u('photo-1427504494785-3a9ca7044f45')} alt="Students writing in notebooks" />
          <Img src={u('photo-1546410531-bb4caa6b424d')} alt="Student studying with books" />
        </div>
      </section>
    </>
  );
}
