import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { z } from 'zod';
import { connectDB } from './db.js';
import { User, Course, Enrollment, Inquiry, Application, LEVELS } from './models.js';
import { issueSession, clearSession, loadUser, requireAuth, requireRole } from './auth.js';
import { ensureSeed, DEMO } from './seed.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isId = (v) => mongoose.isValidObjectId(v);
const isDemoAccount = (u) => [DEMO.student.email, DEMO.instructor.email].includes(u.email);
const stripe = () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);
const ADMISSION_FEE = 5000; // one-time, PKR
const siteUrl = (req) => process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

// --- database + first-run seed --------------------------------------------
let adminEnsured = false;
app.use('/api', wrap(async (req, _res, next) => {
  if (req.path === '/health') return next();
  await connectDB();
  await ensureSeed();
  if (!adminEnsured && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const exists = await User.findOne({ email });
    if (!exists) await User.create({ name: process.env.ADMIN_NAME || 'Academy Admin', email, role: 'admin', passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });
    else if (exists.role !== 'admin') { exists.role = 'admin'; await exists.save(); }
    adminEnsured = true;
  }
  next();
}));
app.use('/api', loadUser);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please wait a few minutes.' } });
const formLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many messages. Please try again later.' } });

const parse = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) throw Object.assign(new Error(r.error.issues[0]?.message || 'Invalid input'), { status: 400 });
  return r.data;
};

// --- health -------------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true, db: !!process.env.MONGODB_URI, stripe: !!process.env.STRIPE_SECRET_KEY }));
app.get('/api/config', (_req, res) => res.json({ admissionFee: ADMISSION_FEE, stripe: !!process.env.STRIPE_SECRET_KEY, demoPayments: !process.env.STRIPE_SECRET_KEY && process.env.DEMO_PAYMENTS !== 'false', demo: DEMO }));

// --- auth ---------------------------------------------------------------
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email.').max(120);
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.').max(100);

app.post('/api/auth/register', authLimiter, wrap(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(2, 'Enter your full name.').max(80), email: emailSchema, password: passwordSchema, phone: z.string().trim().max(30).optional(), grade: z.string().trim().max(40).optional() }), req.body);
  if (await User.exists({ email: body.email })) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = await User.create({ name: body.name, email: body.email, phone: body.phone, grade: body.grade, role: 'student', passwordHash: await bcrypt.hash(body.password, 10) });
  issueSession(res, user);
  res.status(201).json({ user: user.toPublic() });
}));

app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
  const body = parse(z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password.').max(100) }), req.body);
  const user = await User.findOne({ email: body.email }).select('+passwordHash');
  if (!user || !user.active || !(await bcrypt.compare(body.password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  issueSession(res, user);
  res.json({ user: user.toPublic() });
}));

app.post('/api/auth/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });
app.get('/api/auth/me', (req, res) => res.json({ user: req.user ? req.user.toPublic() : null }));

app.patch('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().max(30).optional(), grade: z.string().trim().max(40).optional(), bio: z.string().trim().max(600).optional(), currentPassword: z.string().max(100).optional(), newPassword: passwordSchema.optional() }), req.body);
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (body.newPassword) {
    if (isDemoAccount(user)) return res.status(403).json({ error: 'Demo account passwords cannot be changed.' });
    if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) return res.status(400).json({ error: 'Current password is incorrect.' });
    user.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }
  for (const k of ['name', 'phone', 'grade', 'bio']) if (body[k] !== undefined) user[k] = body[k];
  await user.save();
  res.json({ user: user.toPublic() });
}));

// --- public catalog -----------------------------------------------------
const publicCourse = (c, { full = false, unlocked = false } = {}) => ({
  id: c._id.toString(), title: c.title, slug: c.slug, subject: c.subject, level: c.level, board: c.board, summary: c.summary,
  image: c.image, price: c.price, currency: c.currency, mode: c.mode, schedule: c.schedule, startDate: c.startDate, seats: c.seats,
  featured: c.featured, published: c.published, lessonCount: c.lessons?.length || 0,
  instructor: c.instructor && c.instructor.name ? { id: c.instructor._id.toString(), name: c.instructor.name, qualification: c.instructor.qualification, bio: c.instructor.bio } : undefined,
  ...(full ? {
    description: c.description, outcomes: c.outcomes,
    lessons: (c.lessons || []).map((l) => ({ id: l._id.toString(), title: l.title, duration: l.duration, free: l.free, ...(unlocked || l.free ? { summary: l.summary, videoUrl: l.videoUrl } : {}) })),
  } : {}),
});

app.get('/api/courses', wrap(async (req, res) => {
  const q = parse(z.object({ level: z.string().max(40).optional(), subject: z.string().max(60).optional(), mode: z.string().max(20).optional(), q: z.string().max(80).optional(), featured: z.string().optional() }), req.query);
  const filter = { published: true };
  if (q.level) filter.level = q.level;
  if (q.subject) filter.subject = q.subject;
  if (q.mode) filter.mode = q.mode;
  if (q.featured === 'true') filter.featured = true;
  if (q.q) filter.$or = [{ title: new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { subject: new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
  const courses = await Course.find(filter).populate('instructor', 'name qualification bio').sort({ featured: -1, createdAt: 1 }).lean({ virtuals: false });
  res.json({ courses: courses.map((c) => publicCourse(c)) });
}));

app.get('/api/courses/meta', wrap(async (_req, res) => {
  const [subjects, counts, students, teachers] = await Promise.all([
    Course.distinct('subject', { published: true }),
    Course.aggregate([{ $match: { published: true } }, { $group: { _id: '$level', n: { $sum: 1 } } }]),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
  ]);
  res.json({ levels: LEVELS, subjects: subjects.sort(), levelCounts: Object.fromEntries(counts.map((c) => [c._id, c.n])), students, teachers });
}));

app.get('/api/courses/:slug', wrap(async (req, res) => {
  const course = await Course.findOne({ slug: String(req.params.slug).toLowerCase() }).populate('instructor', 'name qualification bio').lean();
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  const isOwner = req.user && (req.user.role === 'admin' || course.instructor?._id?.equals(req.user._id));
  if (!course.published && !isOwner) return res.status(404).json({ error: 'Course not found.' });
  let enrollment = null;
  if (req.user) enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id }).lean();
  const enrolled = enrollment?.status === 'active';
  const taken = await Enrollment.countDocuments({ course: course._id, status: 'active' });
  res.json({ course: { ...publicCourse(course, { full: true, unlocked: enrolled || isOwner }), seatsLeft: Math.max(0, course.seats - taken) }, enrollment: enrollment ? { id: enrollment._id.toString(), status: enrollment.status, completed: enrollment.completedLessons.map(String) } : null });
}));

app.get('/api/instructors', wrap(async (_req, res) => {
  const teachers = await User.find({ role: 'instructor', active: true }).lean();
  const counts = await Course.aggregate([{ $match: { published: true } }, { $group: { _id: '$instructor', n: { $sum: 1 }, subjects: { $addToSet: '$subject' } } }]);
  const byId = Object.fromEntries(counts.map((c) => [c._id.toString(), c]));
  res.json({ instructors: teachers.map((t) => ({ id: t._id.toString(), name: t.name, qualification: t.qualification, bio: t.bio, courses: byId[t._id.toString()]?.n || 0, subjects: byId[t._id.toString()]?.subjects || [] })) });
}));

// --- enrollment + payments ----------------------------------------------
async function seatsAvailable(course) {
  const taken = await Enrollment.countDocuments({ course: course._id, status: 'active' });
  return taken < course.seats;
}

app.post('/api/enroll', requireRole('student'), wrap(async (req, res) => {
  const { courseId } = parse(z.object({ courseId: z.string().refine(isId, 'Invalid course.') }), req.body);
  const course = await Course.findOne({ _id: courseId, published: true });
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (existing?.status === 'active') return res.json({ status: 'active', enrollmentId: existing._id });
  if (!(await seatsAvailable(course))) return res.status(409).json({ error: 'This class is full. Contact the office to join the waiting list.' });

  const amount = course.price;
  const s = stripe();
  if (amount === 0 || (!s && process.env.DEMO_PAYMENTS !== 'false')) {
    const method = amount === 0 ? 'free' : 'demo';
    const enr = await Enrollment.findOneAndUpdate({ student: req.user._id, course: course._id }, { $set: { status: 'active', amount, currency: course.currency, paymentMethod: method, paidAt: new Date() } }, { upsert: true, new: true });
    return res.json({ status: 'active', enrollmentId: enr._id, demo: method === 'demo' });
  }
  if (!s) return res.status(503).json({ error: 'Online payments are not set up yet. Please pay at the office.' });

  const session = await s.checkout.sessions.create({
    mode: 'payment',
    customer_email: req.user.email,
    line_items: [{ quantity: 1, price_data: { currency: course.currency.toLowerCase(), unit_amount: Math.round(amount * 100), product_data: { name: course.title, description: `${course.level} · ${course.schedule || ''}`.trim() } } }],
    metadata: { courseId: course._id.toString(), studentId: req.user._id.toString() },
    success_url: `${siteUrl(req)}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl(req)}/courses/${course.slug}?payment=cancelled`,
  });
  await Enrollment.findOneAndUpdate({ student: req.user._id, course: course._id }, { $set: { status: 'pending', amount, currency: course.currency, paymentMethod: 'stripe', stripeSessionId: session.id } }, { upsert: true, new: true });
  res.json({ status: 'checkout', url: session.url });
}));

app.get('/api/payments/confirm', requireAuth, wrap(async (req, res) => {
  const { session_id: sessionId } = parse(z.object({ session_id: z.string().min(10).max(200) }), req.query);
  const s = stripe();
  if (!s) return res.status(400).json({ error: 'Payments are not configured.' });
  const session = await s.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.studentId !== req.user._id.toString()) return res.status(403).json({ error: 'This payment belongs to another account.' });
  if (session.payment_status !== 'paid') return res.status(402).json({ error: 'Payment has not completed yet.' });
  const enr = await Enrollment.findOneAndUpdate({ stripeSessionId: session.id, student: req.user._id }, { $set: { status: 'active', paidAt: new Date() } }, { new: true }).populate('course', 'title slug');
  if (!enr) return res.status(404).json({ error: 'Enrollment not found.' });
  res.json({ status: 'active', course: { title: enr.course.title, slug: enr.course.slug } });
}));

// --- student area -------------------------------------------------------
app.get('/api/me/enrollments', requireAuth, wrap(async (req, res) => {
  const list = await Enrollment.find({ student: req.user._id, status: { $ne: 'cancelled' } }).populate({ path: 'course', populate: { path: 'instructor', select: 'name' } }).sort({ createdAt: -1 }).lean();
  res.json({ enrollments: list.filter((e) => e.course).map((e) => ({ id: e._id.toString(), status: e.status, paidAt: e.paidAt, amount: e.amount, paymentMethod: e.paymentMethod, completed: e.completedLessons.map(String), course: publicCourse(e.course, { full: true, unlocked: e.status === 'active' }) })) });
}));

app.post('/api/me/enrollments/:id/lessons/:lessonId', requireAuth, wrap(async (req, res) => {
  if (!isId(req.params.id) || !isId(req.params.lessonId)) return res.status(400).json({ error: 'Invalid id.' });
  const enr = await Enrollment.findOne({ _id: req.params.id, student: req.user._id, status: 'active' }).populate('course', 'lessons');
  if (!enr) return res.status(404).json({ error: 'Enrollment not found.' });
  const lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
  if (!enr.course.lessons.some((l) => l._id.equals(lessonId))) return res.status(404).json({ error: 'Lesson not found.' });
  const done = enr.completedLessons.some((x) => x.equals(lessonId));
  enr.completedLessons = done ? enr.completedLessons.filter((x) => !x.equals(lessonId)) : [...enr.completedLessons, lessonId];
  await enr.save();
  res.json({ completed: enr.completedLessons.map(String) });
}));

// --- instructor + admin course management -------------------------------
const lessonInput = z.object({ _id: z.string().optional(), id: z.string().optional(), title: z.string().trim().min(2).max(140), duration: z.coerce.number().int().min(5).max(300).default(45), summary: z.string().trim().max(1500).optional().default(''), videoUrl: z.string().trim().max(500).optional().default(''), free: z.boolean().optional().default(false) });
const courseInput = z.object({
  title: z.string().trim().min(4, 'Title is too short.').max(140),
  subject: z.string().trim().min(2).max(60),
  level: z.enum(LEVELS),
  board: z.string().trim().max(60).optional(),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  image: z.string().trim().url('Image must be a full URL.').max(500).or(z.literal('')).optional(),
  price: z.coerce.number().min(0).max(1_000_000),
  mode: z.enum(['Online', 'On campus', 'Hybrid']),
  schedule: z.string().trim().max(120).optional(),
  startDate: z.coerce.date().optional(),
  seats: z.coerce.number().int().min(1).max(500),
  outcomes: z.array(z.string().trim().max(200)).max(12).optional(),
  lessons: z.array(lessonInput).max(80).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  instructorId: z.string().optional(),
});
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

async function uniqueSlug(title, excludeId) {
  const base = slugify(title) || 'course';
  let slug = base; let i = 2;
  while (await Course.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${base}-${i++}`;
  return slug;
}

const canManage = (user, course) => user.role === 'admin' || course.instructor.equals(user._id);

app.get('/api/manage/courses', requireRole('instructor', 'admin'), wrap(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter).populate('instructor', 'name').sort({ createdAt: -1 }).lean();
  const counts = await Enrollment.aggregate([{ $match: { course: { $in: courses.map((c) => c._id) }, status: 'active' } }, { $group: { _id: '$course', n: { $sum: 1 } } }]);
  const byId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.n]));
  res.json({ courses: courses.map((c) => ({ ...publicCourse(c, { full: true, unlocked: true }), students: byId[c._id.toString()] || 0 })) });
}));

app.post('/api/manage/courses', requireRole('instructor', 'admin'), wrap(async (req, res) => {
  const body = parse(courseInput, req.body);
  let instructor = req.user._id;
  if (req.user.role === 'admin' && body.instructorId && isId(body.instructorId)) instructor = body.instructorId;
  const course = await Course.create({ ...body, lessons: (body.lessons || []).map(({ _id, id, ...l }) => l), instructor, slug: await uniqueSlug(body.title), published: body.published ?? false, featured: req.user.role === 'admin' ? !!body.featured : false });
  res.status(201).json({ course: publicCourse(course, { full: true, unlocked: true }) });
}));

app.put('/api/manage/courses/:id', requireRole('instructor', 'admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (!canManage(req.user, course)) return res.status(403).json({ error: 'You can only edit your own courses.' });
  const body = parse(courseInput, req.body);
  if (body.title !== course.title) course.slug = await uniqueSlug(body.title, course._id);
  for (const k of ['title', 'subject', 'level', 'board', 'summary', 'description', 'image', 'price', 'mode', 'schedule', 'startDate', 'seats', 'outcomes', 'published']) if (body[k] !== undefined) course[k] = body[k];
  if (req.user.role === 'admin' && body.featured !== undefined) course.featured = body.featured;
  if (body.lessons) course.lessons = body.lessons.map(({ id, _id, ...l }) => ({ ...(isId(id || _id) ? { _id: id || _id } : {}), ...l }));
  await course.save();
  res.json({ course: publicCourse(course, { full: true, unlocked: true }) });
}));

app.delete('/api/manage/courses/:id', requireRole('instructor', 'admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (!canManage(req.user, course)) return res.status(403).json({ error: 'You can only delete your own courses.' });
  if (await Enrollment.exists({ course: course._id, status: 'active' })) return res.status(409).json({ error: 'Students are enrolled. Unpublish the course instead of deleting it.' });
  await course.deleteOne();
  res.json({ ok: true });
}));

app.get('/api/manage/courses/:id/students', requireRole('instructor', 'admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (!canManage(req.user, course)) return res.status(403).json({ error: 'Not your course.' });
  const list = await Enrollment.find({ course: course._id, status: { $ne: 'cancelled' } }).populate('student', 'name email phone grade').lean();
  res.json({ students: list.filter((e) => e.student).map((e) => ({ enrollmentId: e._id.toString(), status: e.status, name: e.student.name, email: e.student.email, phone: e.student.phone, grade: e.student.grade, progress: course.lessons.length ? Math.round((e.completedLessons.length / course.lessons.length) * 100) : 0, joined: e.createdAt })) });
}));

// --- admin --------------------------------------------------------------
app.get('/api/admin/stats', requireRole('admin'), wrap(async (_req, res) => {
  const [students, instructors, courses, active, pending, inquiries, revenue, recent, applications] = await Promise.all([
    User.countDocuments({ role: 'student' }), User.countDocuments({ role: 'instructor' }), Course.countDocuments(),
    Enrollment.countDocuments({ status: 'active' }), Enrollment.countDocuments({ status: 'pending' }), Inquiry.countDocuments({ status: 'new' }),
    Enrollment.aggregate([{ $match: { status: 'active', paymentMethod: { $in: ['stripe', 'cash'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Enrollment.find().sort({ createdAt: -1 }).limit(8).populate('student', 'name').populate('course', 'title').lean(),
    Application.countDocuments({ status: 'submitted' }),
  ]);
  res.json({ students, instructors, courses, active, pending, newInquiries: inquiries, newApplications: applications, revenue: revenue[0]?.total || 0, recent: recent.filter((e) => e.student && e.course).map((e) => ({ id: e._id.toString(), student: e.student.name, course: e.course.title, status: e.status, method: e.paymentMethod, amount: e.amount, at: e.createdAt })) });
}));

app.get('/api/admin/users', requireRole('admin'), wrap(async (req, res) => {
  const { role, q } = parse(z.object({ role: z.enum(['student', 'instructor', 'admin']).optional(), q: z.string().max(80).optional() }), req.query);
  const filter = {};
  if (role) filter.role = role;
  if (q) { const r = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); filter.$or = [{ name: r }, { email: r }]; }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ users: users.map((u) => u.toPublic()) });
}));

app.patch('/api/admin/users/:id', requireRole('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const body = parse(z.object({ role: z.enum(['student', 'instructor', 'admin']).optional(), active: z.boolean().optional() }), req.body);
  if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'You cannot change your own role or status.' });
  const user = await User.findByIdAndUpdate(req.params.id, { $set: body }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: user.toPublic() });
}));

app.get('/api/admin/enrollments', requireRole('admin'), wrap(async (_req, res) => {
  const list = await Enrollment.find().sort({ createdAt: -1 }).limit(300).populate('student', 'name email').populate('course', 'title price').lean();
  res.json({ enrollments: list.filter((e) => e.student && e.course).map((e) => ({ id: e._id.toString(), student: e.student.name, email: e.student.email, course: e.course.title, status: e.status, method: e.paymentMethod, amount: e.amount, at: e.createdAt })) });
}));

app.patch('/api/admin/enrollments/:id', requireRole('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const body = parse(z.object({ status: z.enum(['pending', 'active', 'cancelled']), paymentMethod: z.enum(['cash', 'stripe', 'demo', 'free']).optional() }), req.body);
  const set = { status: body.status };
  if (body.paymentMethod) set.paymentMethod = body.paymentMethod;
  if (body.status === 'active') set.paidAt = new Date();
  const enr = await Enrollment.findByIdAndUpdate(req.params.id, { $set: set }, { new: true });
  if (!enr) return res.status(404).json({ error: 'Enrollment not found.' });
  res.json({ ok: true });
}));

app.get('/api/admin/inquiries', requireRole('admin'), wrap(async (_req, res) => {
  const list = await Inquiry.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ inquiries: list.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })) });
}));

app.patch('/api/admin/inquiries/:id', requireRole('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const { status } = parse(z.object({ status: z.enum(['new', 'contacted', 'closed']) }), req.body);
  await Inquiry.findByIdAndUpdate(req.params.id, { $set: { status } });
  res.json({ ok: true });
}));

// --- admission applications --------------------------------------------
const applyLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many applications from this connection. Please call the office.' } });
const optional = (schema) => z.preprocess((v) => (v === '' || v == null ? undefined : v), schema.optional());

app.post('/api/applications', applyLimiter, wrap(async (req, res) => {
  const body = parse(z.object({
    student: z.object({
      name: z.string().trim().min(2, 'Enter the student’s full name.').max(80),
      dob: optional(z.coerce.date()),
      gender: optional(z.enum(['Female', 'Male', 'Prefer not to say'])),
      level: z.enum(LEVELS, { errorMap: () => ({ message: 'Choose the class the student is applying for.' }) }),
      school: optional(z.string().trim().max(120)),
      board: optional(z.string().trim().max(60)),
      lastResult: optional(z.string().trim().max(40)),
    }),
    guardian: z.object({
      name: z.string().trim().min(2, 'Enter the parent or guardian’s name.').max(80),
      relation: optional(z.string().trim().max(30)),
      phone: z.string().trim().min(7, 'Enter a phone number we can call.').max(30),
      email: emailSchema,
      city: optional(z.string().trim().max(60)),
      address: optional(z.string().trim().max(240)),
    }),
    courses: z.array(z.string().refine(isId)).min(1, 'Choose at least one course.').max(6),
    mode: optional(z.enum(['Online', 'On campus', 'Hybrid', 'No preference'])),
    heardFrom: optional(z.string().trim().max(60)),
    notes: optional(z.string().trim().max(1500)),
    concession: z.boolean().optional(),
    consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm the details are correct.' }) }),
    website: z.string().max(0).optional(),
  }), req.body);
  const found = await Course.find({ _id: { $in: body.courses }, published: true }).select('_id title price').lean();
  if (!found.length) return res.status(400).json({ error: 'Choose at least one course.' });
  const year = new Date().getFullYear();
  const count = await Application.countDocuments({ ref: new RegExp(`^NS-${year}-`) });
  let ref = `NS-${year}-${String(count + 1).padStart(4, '0')}`;
  if (await Application.exists({ ref })) ref = `NS-${year}-${Date.now().toString().slice(-6)}`;
  const { consent, website, ...data } = body;
  await Application.create({ ...data, courses: found.map((c) => c._id), ref });
  const tuition = found.reduce((a, c) => a + c.price, 0);
  res.status(201).json({ ok: true, ref, courses: found.map((c) => c.title), tuition, admissionFee: ADMISSION_FEE });
}));

app.get('/api/applications/:ref', wrap(async (req, res) => {
  const { email } = parse(z.object({ email: emailSchema }), req.query);
  const a = await Application.findOne({ ref: String(req.params.ref).toUpperCase(), 'guardian.email': email }).populate('courses', 'title').lean();
  if (!a) return res.status(404).json({ error: 'No application found with that reference and email.' });
  res.json({ ref: a.ref, status: a.status, student: a.student.name, level: a.student.level, courses: a.courses.map((c) => c.title), submitted: a.createdAt, note: a.adminNote || '' });
}));

app.get('/api/admin/applications', requireRole('admin'), wrap(async (_req, res) => {
  const list = await Application.find().sort({ createdAt: -1 }).limit(300).populate('courses', 'title price').lean();
  res.json({ applications: list.map((a) => ({ ...a, id: a._id.toString(), _id: undefined })) });
}));

app.patch('/api/admin/applications/:id', requireRole('admin'), wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });
  const body = parse(z.object({ status: z.enum(['submitted', 'test scheduled', 'admitted', 'waitlisted', 'declined']).optional(), adminNote: z.string().trim().max(500).optional() }), req.body);
  const a = await Application.findByIdAndUpdate(req.params.id, { $set: body }, { new: true });
  if (!a) return res.status(404).json({ error: 'Application not found.' });
  res.json({ ok: true });
}));

// --- admissions inquiries -----------------------------------------------
app.post('/api/inquiries', formLimiter, wrap(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(2, 'Enter your name.').max(80), email: emailSchema, phone: z.string().trim().max(30).optional(), level: z.string().trim().max(40).optional(), message: z.string().trim().min(10, 'Please write a little more.').max(2000), website: z.string().max(0).optional() }), req.body);
  delete body.website; // honeypot field for bots
  await Inquiry.create(body);
  res.status(201).json({ ok: true, message: 'Thank you! Our admissions team will contact you within one working day.' });
}));

// --- sitemap (served at /sitemap.xml through a Vercel rewrite) ----------
app.get(['/sitemap.xml', '/api/sitemap.xml'], wrap(async (_req, res) => {
  await connectDB();
  await ensureSeed();
  const base = (process.env.SITE_URL || 'https://northstar-tuition-academy.vercel.app').replace(/\/$/, '');
  const courses = await Course.find({ published: true }).select('slug updatedAt').lean();
  const pages = ['/', '/courses', '/teachers', '/about', '/admissions'].map((p) => ({ loc: base + p, pri: p === '/' ? '1.0' : '0.8' }));
  const items = [...pages, ...courses.map((c) => ({ loc: `${base}/courses/${c.slug}`, pri: '0.7', mod: c.updatedAt }))];
  res.type('application/xml').set('Cache-Control', 'public, s-maxage=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.map((i) => `  <url><loc>${i.loc}</loc>${i.mod ? `<lastmod>${new Date(i.mod).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${i.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
}));

// --- errors -------------------------------------------------------------
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message });
});

export default app;
