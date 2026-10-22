import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { User, Course } from './models.js';

// Sample content for a fictional tuition academy. Everything here is demo data.
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const DEMO = {
  student: { email: 'student@demo.northstar.pk', password: 'Student@2026' },
  instructor: { email: 'teacher@demo.northstar.pk', password: 'Teacher@2026' },
};

const teachers = [
  { key: 'ayesha', name: 'Ayesha Siddiqui', qualification: 'MSc Mathematics, 9 years teaching', bio: 'Makes algebra and calculus feel manageable with lots of worked examples and weekly tests.', demo: true },
  { key: 'usman', name: 'Usman Tariq', qualification: 'MPhil Physics, 11 years teaching', bio: 'Former board examiner. Focuses on concepts first, then past-paper technique.' },
  { key: 'hina', name: 'Dr. Hina Malik', qualification: 'PhD Chemistry, 8 years teaching', bio: 'Teaches chemistry and biology with diagrams, lab videos and short daily quizzes.' },
  { key: 'bilal', name: 'Bilal Ahmed', qualification: 'BS Computer Science, 6 years teaching', bio: 'Teaches programming the practical way: small projects every week.' },
  { key: 'sara', name: 'Sara Javed', qualification: 'MA English Literature, 7 years teaching', bio: 'Helps students write clearly and confidently for O Level and IELTS.' },
];

const L = (titles, freeFirst = true) => titles.map((t, i) => ({ title: t, duration: 45 + (i % 3) * 15, summary: `In this session we cover ${t.toLowerCase()} with examples, practice questions and a short quiz at the end.`, free: freeFirst && i === 0 }));

const courses = [
  { t: 'Matric Mathematics (Class 9-10)', subject: 'Mathematics', level: 'Matric (9-10)', teacher: 'ayesha', price: 24000, mode: 'Hybrid', schedule: 'Mon, Wed, Fri · 4:00 to 5:30 pm', image: img('photo-1635070041078-e363dbe005cb'), featured: true,
    summary: 'Complete Federal and Punjab Board syllabus with weekly tests and past papers.',
    outcomes: ['Solve every exercise in the textbook with confidence', 'Weekly timed tests with feedback', 'Past papers from the last 5 years', 'Monthly progress report for parents'],
    lessons: L(['Real and complex numbers', 'Logarithms', 'Algebraic expressions and formulas', 'Factorisation', 'Linear equations and inequalities', 'Quadratic equations', 'Matrices and determinants', 'Geometry theorems revision']) },
  { t: 'FSc Physics Part I & II', subject: 'Physics', level: 'FSc / ICS (11-12)', teacher: 'usman', price: 38000, mode: 'On campus', schedule: 'Tue, Thu, Sat · 5:00 to 6:30 pm', image: img('photo-1636466497217-26a8cbeaf0aa'), featured: true,
    summary: 'Concept-first physics for pre-engineering and pre-medical students, with MDCAT/ECAT style MCQs.',
    outcomes: ['Clear concepts for every chapter', 'Numerical problem drills', 'MDCAT and ECAT style MCQs', 'Practical notebook guidance'],
    lessons: L(['Measurements and vectors', 'Motion and force', 'Work, energy and power', 'Circular motion', 'Fluid dynamics', 'Oscillations and waves', 'Electrostatics', 'Current electricity']) },
  { t: 'FSc Chemistry (Pre-Medical)', subject: 'Chemistry', level: 'FSc / ICS (11-12)', teacher: 'hina', price: 36000, mode: 'Hybrid', schedule: 'Mon, Wed, Fri · 6:00 to 7:30 pm', image: img('photo-1532094349884-543bc11b234d'), featured: true,
    summary: 'Organic, inorganic and physical chemistry explained step by step, with lab demonstrations.',
    outcomes: ['Reaction mechanisms made simple', 'Short notes for every chapter', 'Chapter-wise MCQ tests', 'Lab practical preparation'],
    lessons: L(['Basic concepts and the mole', 'Atomic structure', 'Chemical bonding', 'Gases, liquids and solids', 'Chemical equilibrium', 'Hydrocarbons', 'Alcohols and phenols', 'Carbonyl compounds']) },
  { t: 'Matric Biology (Class 9-10)', subject: 'Biology', level: 'Matric (9-10)', teacher: 'hina', price: 22000, mode: 'Online', schedule: 'Tue, Thu · 4:00 to 5:30 pm', image: img('photo-1530026405186-ed1f139313f8'),
    summary: 'Diagram-heavy biology with labelling practice and board-style long questions.',
    outcomes: ['Neat, labelled diagrams', 'Long-question answer structure', 'Monthly mock exams', 'Recorded sessions to revise from'],
    lessons: L(['Introduction to biology', 'Cells and tissues', 'Cell cycle', 'Enzymes', 'Bioenergetics', 'Nutrition', 'Transport', 'Gaseous exchange']) },
  { t: 'O Level Computer Science (2210)', subject: 'Computer Science', level: 'O Level', teacher: 'bilal', price: 45000, mode: 'Online', schedule: 'Sat, Sun · 11:00 am to 1:00 pm', image: img('photo-1498050108023-c5249f4df085'), featured: true,
    summary: 'Cambridge 2210 theory and Python programming, including pre-release practice.',
    outcomes: ['Python programming from zero', 'Pseudocode and flowcharts', 'Theory topics with past papers', 'Paper 2 problem-solving practice'],
    lessons: L(['Data representation', 'Data transmission', 'Hardware and software', 'Algorithms and flowcharts', 'Python basics', 'Arrays and loops', 'Databases and SQL', 'Boolean logic']) },
  { t: 'O Level English Language (1123)', subject: 'English', level: 'O Level', teacher: 'sara', price: 38000, mode: 'Hybrid', schedule: 'Mon, Thu · 5:00 to 6:30 pm', image: img('photo-1456513080510-7bf3a84b82f8'),
    summary: 'Directed writing, composition and comprehension with personal feedback on every essay.',
    outcomes: ['Essay structure that examiners like', 'Weekly marked writing tasks', 'Comprehension techniques', 'Vocabulary building'],
    lessons: L(['Reading for meaning', 'Summary writing', 'Directed writing: letters and reports', 'Narrative composition', 'Descriptive composition', 'Argumentative writing', 'Grammar refresh', 'Exam strategy']) },
  { t: 'A Level Mathematics (9709)', subject: 'Mathematics', level: 'A Level', teacher: 'ayesha', price: 55000, mode: 'Online', schedule: 'Tue, Fri · 7:00 to 9:00 pm', image: img('photo-1509228468518-180dd4864904'),
    summary: 'Pure Mathematics 1 and Statistics 1 for Cambridge 9709, with topic tests and full mocks.',
    outcomes: ['Pure 1 and Stats 1 full coverage', 'Topical past papers', 'Two full mock exams', 'One-to-one doubt sessions'],
    lessons: L(['Quadratics', 'Functions', 'Coordinate geometry', 'Circular measure', 'Trigonometry', 'Series', 'Differentiation', 'Integration']) },
  { t: 'Foundation Maths & Science (Grade 6-8)', subject: 'Science', level: 'Grade 6-8', teacher: 'usman', price: 15000, mode: 'On campus', schedule: 'Mon to Thu · 3:30 to 4:30 pm', image: img('photo-1503676260728-1c00da094a0b'), featured: true,
    summary: 'Strong basics in maths and general science for middle-school students, in small groups.',
    outcomes: ['Small groups of up to 12', 'Homework help every day', 'Fun experiments and activities', 'Fortnightly parent updates'],
    lessons: L(['Number sense and fractions', 'Ratios and percentages', 'Basic algebra', 'Matter and its states', 'Forces and motion', 'Living things and habitats', 'Electricity basics', 'Earth and space']) },
  { t: 'ICS Computer Science (Part I & II)', subject: 'Computer Science', level: 'FSc / ICS (11-12)', teacher: 'bilal', price: 30000, mode: 'Hybrid', schedule: 'Wed, Sat · 3:00 to 4:30 pm', image: img('photo-1513258496099-48168024aec0'),
    summary: 'C programming, databases and computer fundamentals for ICS students, with lab practicals.',
    outcomes: ['C language programs step by step', 'MS Access and SQL basics', 'Practical exam preparation', 'Board past papers'],
    lessons: L(['Computer fundamentals', 'Data communication', 'Networks', 'Introduction to C', 'Decisions and loops', 'Functions and arrays', 'Database concepts', 'SQL queries']) },
];

const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Fee update (Oct 2026): move seeded courses to the new fee only if an admin has not changed the price.
const FEE_UPDATE = [
  ['matric mathematics (class 9-10)', 14000, 24000],
  ['fsc physics part i and ii', 22000, 38000],
  ['fsc chemistry (pre-medical)', 20000, 36000],
  ['matric biology (class 9-10)', 12000, 22000],
  ['o level computer science (2210)', 25000, 45000],
  ['o level english language (1123)', 18000, 38000],
  ['a level mathematics (9709)', 32000, 55000],
  ['foundation maths and science (grade 6-8)', 9000, 15000],
  ['ics computer science (part i and ii)', 16000, 30000],
];
let feesSynced = false;
async function syncFees() {
  if (feesSynced) return;
  feesSynced = true;
  await Promise.all(FEE_UPDATE.map(([title, from, to]) => Course.updateOne({ slug: slugify(title), price: from }, { $set: { price: to } })));
}

let seeding = null;

export async function ensureSeed() {
  if (seeding) return seeding;
  seeding = (async () => {
    if (await Course.estimatedDocumentCount() > 0) { await syncFees(); return { seeded: false }; }

    const hash = (p) => bcrypt.hash(p, 10);
    const randomPw = () => crypto.randomBytes(18).toString('base64url');

    const teacherDocs = {};
    for (const t of teachers) {
      const email = t.demo ? DEMO.instructor.email : `${t.key}@teachers.northstar.pk`;
      const user = await User.findOneAndUpdate(
        { email },
        { $setOnInsert: { name: t.name, email, role: 'instructor', qualification: t.qualification, bio: t.bio, passwordHash: await hash(t.demo ? DEMO.instructor.password : randomPw()) } },
        { upsert: true, new: true },
      );
      teacherDocs[t.key] = user;
    }

    await User.findOneAndUpdate(
      { email: DEMO.student.email },
      { $setOnInsert: { name: 'Hamza Khan', email: DEMO.student.email, role: 'student', grade: 'Class 10', passwordHash: await hash(DEMO.student.password) } },
      { upsert: true, new: true },
    );

    // Real admin account comes from environment variables, never from code.
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await User.findOneAndUpdate(
        { email: process.env.ADMIN_EMAIL.toLowerCase() },
        { $set: { role: 'admin' }, $setOnInsert: { name: process.env.ADMIN_NAME || 'Academy Admin', passwordHash: await hash(process.env.ADMIN_PASSWORD) } },
        { upsert: true, new: true },
      );
    }

    const start = new Date();
    start.setDate(start.getDate() + 14);
    await Course.insertMany(courses.map((c) => ({
      title: c.t, slug: slugify(c.t), subject: c.subject, level: c.level, summary: c.summary,
      description: `${c.summary}\n\nClasses are kept small so every student gets attention. Each week includes a short test, and parents receive a progress update. Notes and recordings are shared in the student portal after every class.`,
      image: c.image, price: c.price, mode: c.mode, schedule: c.schedule, startDate: start, seats: 25,
      outcomes: c.outcomes, lessons: c.lessons, instructor: teacherDocs[c.teacher]._id, featured: !!c.featured, published: true,
    })));
    return { seeded: true };
  })();
  try {
    return await seeding;
  } finally {
    seeding = null;
  }
}
