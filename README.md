# Northstar Tuition Academy (MERN)

A full-stack tuition academy website built with **MongoDB, Express, React and Node**. Students browse courses, create an account, enroll and pay, then follow lessons and track progress. Teachers manage their own courses and lesson plans. Admins see the whole academy: users, roles, enrollments, payments and admission inquiries.

The academy, people and contact details are fictional. This is a portfolio project by [Shakir Hussain](https://shakir-portfolio-azure.vercel.app).

## Features

**Public site**
- Home page with programs by level, popular courses, teachers, testimonials and a trial-class call to action
- Course catalog with search and filters (level, subject, mode)
- Course pages with fee, schedule, seats left, outcomes, lesson plan (free preview lessons) and teacher profile
- Teachers, About and Admissions pages (admissions form saves inquiries to MongoDB, with rate limiting and a honeypot)

**Accounts and roles**
- Email and password sign-up and sign-in (bcrypt hashes, JWT in an httpOnly cookie)
- Three roles: `student`, `instructor`, `admin`, enforced on every API route

**Student dashboard**
- My classes, lessons unlocked after enrollment, tick lessons off, progress per course and overall
- Profile and password change

**Teacher dashboard**
- Create, edit, publish and delete courses
- Lesson builder (add, reorder, free preview, recording link)
- Class roster with each student's progress

**Admin dashboard**
- Live stats (students, teachers, courses, enrollments, revenue)
- Manage all courses, feature courses on the home page, assign teachers
- Change user roles, disable accounts
- Mark cash payments as paid, cancel enrollments
- Handle admission inquiries

**Payments**
- Stripe Checkout in **test mode** when `STRIPE_SECRET_KEY` is set (PKR). Test card `4242 4242 4242 4242`.
- Without a Stripe key the site runs in demo mode: enrollment is activated straight away and marked `demo`.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, React Router 7, Vite 6, plain CSS (no UI kit) |
| Backend | Node 22, Express 4, Zod validation, Helmet, express-rate-limit |
| Database | MongoDB Atlas with Mongoose 8 |
| Auth | bcryptjs, jsonwebtoken, httpOnly cookies |
| Payments | Stripe Checkout |
| Hosting | Vercel (static React build + one serverless function for the API) |

## Project structure

```
api/index.js          Vercel serverless entry (exports the Express app)
server/app.js         All API routes
server/models.js      User, Course, Enrollment, Inquiry schemas
server/auth.js        Sessions and role guards
server/seed.js        Sample teachers, courses and demo accounts (runs once on an empty database)
server/db.js          Cached MongoDB connection for serverless
client/               React app (Vite)
vercel.json           Build, rewrites and function settings
```

## Run locally

1. Copy `.env.example` to `.env` and fill in `MONGODB_URI` and `JWT_SECRET`.
2. Install and start:

```bash
npm install
npm --prefix client install
npm run dev:api      # API on http://localhost:4000
npm run dev:client   # React on http://localhost:5173 (proxies /api)
```

The first API request seeds the database with sample courses and these demo accounts:

| Role | Email | Password |
|---|---|---|
| Student | student@demo.northstar.pk | Student@2026 |
| Teacher | teacher@demo.northstar.pk | Teacher@2026 |

The admin account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. It is never hard-coded.

## Deploy to Vercel

1. Import the repository in Vercel. The settings in `vercel.json` are picked up automatically.
2. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, and optionally `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY` (test key), `SITE_URL`.
3. In MongoDB Atlas, allow network access from `0.0.0.0/0` (Vercel functions do not have fixed IPs).

## API overview

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | public |
| GET, PATCH | `/api/auth/me` | signed in |
| GET | `/api/courses`, `/api/courses/meta`, `/api/courses/:slug`, `/api/instructors` | public |
| POST | `/api/enroll` | student |
| GET | `/api/payments/confirm` | signed in |
| GET, POST | `/api/me/enrollments`, `/api/me/enrollments/:id/lessons/:lessonId` | student |
| GET, POST, PUT, DELETE | `/api/manage/courses[/:id]`, `/api/manage/courses/:id/students` | teacher, admin |
| GET, PATCH | `/api/admin/stats`, `/api/admin/users`, `/api/admin/enrollments`, `/api/admin/inquiries` | admin |
| POST | `/api/inquiries` | public (rate limited) |

Images are from [Unsplash](https://unsplash.com) and load from their CDN.
