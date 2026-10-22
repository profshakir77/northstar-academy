import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

export const ROLES = ['student', 'instructor', 'admin'];
export const LEVELS = ['Grade 6-8', 'Matric (9-10)', 'FSc / ICS (11-12)', 'O Level', 'A Level'];

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'student', index: true },
  phone: { type: String, trim: true, maxlength: 30 },
  grade: { type: String, trim: true, maxlength: 40 },
  bio: { type: String, trim: true, maxlength: 600 },
  avatar: { type: String, trim: true, maxlength: 500 },
  qualification: { type: String, trim: true, maxlength: 120 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.methods.toPublic = function toPublic() {
  return { id: this._id.toString(), name: this.name, email: this.email, role: this.role, phone: this.phone, grade: this.grade, bio: this.bio, avatar: this.avatar, qualification: this.qualification, active: this.active, createdAt: this.createdAt };
};

const lessonSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  duration: { type: Number, default: 45, min: 5, max: 300 },
  summary: { type: String, trim: true, maxlength: 1500 },
  videoUrl: { type: String, trim: true, maxlength: 500 },
  free: { type: Boolean, default: false },
}, { _id: true });

const courseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subject: { type: String, required: true, trim: true, maxlength: 60, index: true },
  level: { type: String, enum: LEVELS, required: true, index: true },
  board: { type: String, trim: true, maxlength: 60, default: 'Federal Board' },
  summary: { type: String, trim: true, maxlength: 300 },
  description: { type: String, trim: true, maxlength: 5000 },
  image: { type: String, trim: true, maxlength: 500 },
  price: { type: Number, required: true, min: 0, max: 1_000_000 },
  currency: { type: String, default: 'PKR' },
  mode: { type: String, enum: ['Online', 'On campus', 'Hybrid'], default: 'Hybrid' },
  schedule: { type: String, trim: true, maxlength: 120 },
  startDate: { type: Date },
  seats: { type: Number, default: 30, min: 1, max: 500 },
  outcomes: [{ type: String, trim: true, maxlength: 200 }],
  lessons: [lessonSchema],
  instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  published: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false },
}, { timestamps: true });
courseSchema.index({ title: 'text', subject: 'text', summary: 'text' });

const enrollmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  status: { type: String, enum: ['pending', 'active', 'cancelled'], default: 'pending', index: true },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'PKR' },
  paymentMethod: { type: String, enum: ['free', 'stripe', 'demo', 'cash'], default: 'demo' },
  stripeSessionId: { type: String, index: true, sparse: true },
  paidAt: { type: Date },
  completedLessons: [{ type: Schema.Types.ObjectId }],
}, { timestamps: true });
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const inquirySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  phone: { type: String, trim: true, maxlength: 30 },
  level: { type: String, trim: true, maxlength: 40 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
}, { timestamps: true });

const applicationSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  student: {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    dob: { type: Date },
    gender: { type: String, enum: ['Female', 'Male', 'Prefer not to say'], default: 'Prefer not to say' },
    level: { type: String, enum: LEVELS, required: true },
    school: { type: String, trim: true, maxlength: 120 },
    board: { type: String, trim: true, maxlength: 60 },
    lastResult: { type: String, trim: true, maxlength: 40 },
  },
  guardian: {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    relation: { type: String, trim: true, maxlength: 30 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 60 },
    address: { type: String, trim: true, maxlength: 240 },
  },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  mode: { type: String, enum: ['Online', 'On campus', 'Hybrid', 'No preference'], default: 'No preference' },
  heardFrom: { type: String, trim: true, maxlength: 60 },
  notes: { type: String, trim: true, maxlength: 1500 },
  concession: { type: Boolean, default: false },
  status: { type: String, enum: ['submitted', 'test scheduled', 'admitted', 'waitlisted', 'declined'], default: 'submitted', index: true },
  adminNote: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

export const User = models.User || model('User', userSchema);
export const Course = models.Course || model('Course', courseSchema);
export const Enrollment = models.Enrollment || model('Enrollment', enrollmentSchema);
export const Inquiry = models.Inquiry || model('Inquiry', inquirySchema);
export const Application = models.Application || model('Application', applicationSchema);
