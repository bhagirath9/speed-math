import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Establishes a cached connection to MongoDB using Mongoose.
 * Reuses active database connections to optimize resource usage in serverless environments.
 */
async function dbConnect() {
  // If active connection already exists in the local caching object, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If connection is not in progress, start a new Mongoose connection promise
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering command queueing to fail fast on errors
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  // Await promise completion and store established database connection reference
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Clear promise query if error occurs so subsequent attempts can re-try
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

