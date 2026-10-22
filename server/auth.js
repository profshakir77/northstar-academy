import jwt from 'jsonwebtoken';
import { User } from './models.js';

const COOKIE = 'ns_token';
const DAY = 24 * 60 * 60 * 1000;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw Object.assign(new Error('JWT_SECRET must be set (32+ characters)'), { status: 500 });
  return s;
}

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, secret(), { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * DAY,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

// Attaches req.user when a valid session cookie (or Bearer token) is present.
export async function loadUser(req, _res, next) {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const token = req.cookies?.[COOKIE] || bearer;
    if (!token) return next();
    const payload = jwt.verify(token, secret());
    const user = await User.findById(payload.sub);
    if (user && user.active) req.user = user;
  } catch {
    // invalid or expired token: treat as signed out
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in first.' });
  next();
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Please sign in first.' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have access to this.' });
  next();
};
