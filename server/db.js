import mongoose from 'mongoose';

// Reuse one connection across serverless invocations (Vercel keeps the
// module warm between requests), so we don't open a new pool every time.
let cached = globalThis.__mongoose;
if (!cached) cached = globalThis.__mongoose = { conn: null, promise: null };

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (cached.conn) return cached.conn;
  if (!uri) throw Object.assign(new Error('MONGODB_URI is not set'), { status: 500 });
  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || 'northstar_academy',
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
