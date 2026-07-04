import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { seedIfEmpty } from "./seed";

/**
 * Database bootstrap.
 *
 * If MONGODB_URI is set (see .env.example) we connect to that instance.
 * Otherwise we boot an embedded local MongoDB (mongodb-memory-server)
 * whose data files persist under db/data, so seeded data survives
 * restarts without requiring a system-wide MongoDB install.
 *
 * The connection promise is cached on globalThis because Next.js dev
 * mode re-evaluates modules on hot reload.
 */

const DB_NAME = process.env.MONGODB_DB || "fablefile";

type MongoGlobal = typeof globalThis & {
  __fableMongo?: Promise<typeof mongoose>;
};

async function boot(): Promise<typeof mongoose> {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.join(process.cwd(), "db", "data");
    fs.mkdirSync(dbPath, { recursive: true });
    const server = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: "wiredTiger" },
      binary: { downloadDir: path.join(process.cwd(), "db", "mongodb-binaries") },
    });
    uri = server.getUri();
    console.log(`[db] embedded MongoDB running at ${uri} (data: db/data)`);
  }

  const conn = await mongoose.connect(uri, { dbName: DB_NAME });
  await seedIfEmpty();
  return conn;
}

export async function connectDb(): Promise<typeof mongoose> {
  const g = globalThis as MongoGlobal;
  if (!g.__fableMongo) {
    g.__fableMongo = boot().catch((err) => {
      // Clear the cache so the next request retries instead of caching a rejection.
      g.__fableMongo = undefined;
      throw err;
    });
  }
  return g.__fableMongo;
}
