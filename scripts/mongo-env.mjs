import { MongoClient } from 'mongodb';

/**
 * Optional MONGODB_USER + MONGODB_PASSWORD when your URI has no user:pass@host segment.
 * @returns {import('mongodb').MongoClientOptions}
 */
export function mongoOptionsFromEnv() {
  const user = process.env.MONGODB_USER?.trim();
  const pass = process.env.MONGODB_PASSWORD;
  if (user && pass != null && String(pass).length > 0) {
    return { auth: { username: user, password: String(pass) } };
  }
  return {};
}

export function createMongoClient(uri) {
  return new MongoClient(uri, mongoOptionsFromEnv());
}
