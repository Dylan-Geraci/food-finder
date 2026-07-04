/**
 * Standalone seeding tool: `npm run seed`
 *
 * Boots the same embedded local MongoDB the app uses (db/data), wipes the
 * five collections, and repopulates them from db/mock-data.json.
 *
 * NOTE: the dev server auto-seeds an empty database on boot, so this script
 * is only needed to RESET data. Stop the dev server first — two processes
 * cannot lock the same db/data directory at once.
 *
 * Rating math mirrors src/services/rating.ts (source of truth).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mock = JSON.parse(fs.readFileSync(path.join(__dirname, "mock-data.json"), "utf8"));

const DB_NAME = process.env.MONGODB_DB || "fablefile";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Mirrors computeAverage in src/services/rating.ts: empty -> 0.0, never NaN.
const clamp = (s) => Math.min(5, Math.max(1, s));
const average = (stars) =>
  stars.length === 0 ? 0.0 : stars.reduce((a, s) => a + clamp(s), 0) / stars.length;

let memoryServer = null;

async function resolveUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = path.join(__dirname, "data");
  fs.mkdirSync(dbPath, { recursive: true });
  memoryServer = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: "wiredTiger" },
    binary: { downloadDir: path.join(__dirname, "mongodb-binaries") },
  });
  return memoryServer.getUri();
}

const uri = await resolveUri();
await mongoose.connect(uri, { dbName: DB_NAME });
const db = mongoose.connection.db;

console.log(`[seed] connected to ${uri}`);

for (const name of ["users", "cookprofiles", "meals", "reviews", "orders"]) {
  await db.collection(name).deleteMany({});
}

const now = Date.now();

// 1. Users
const userDocs = mock.users.map((u) => ({
  key: u.key,
  name: u.name,
  email: u.email,
  role: u.role,
  addresses: u.addresses ?? [],
  favoriteCookIds: [],
  joinedAt: new Date(now - 120 * DAY_MS),
}));
const { insertedIds: userIds } = await db.collection("users").insertMany(userDocs);
const userIdByKey = new Map(mock.users.map((u, i) => [u.key, userIds[i]]));

// 2. Cook profiles
const cookDocs = mock.cookProfiles.map((c) => ({
  userId: userIdByKey.get(c.userKey),
  kitchenName: c.kitchenName,
  bio: c.bio,
  portrait: c.portrait,
  location: c.location,
  certifications: c.certifications,
  operatingHours: c.operatingHours,
  cuisines: c.cuisines,
  ratingAvg: 0.0,
  ratingCount: 0,
}));
const { insertedIds: cookIds } = await db.collection("cookprofiles").insertMany(cookDocs);
const cookIdByUserKey = new Map(mock.cookProfiles.map((c, i) => [c.userKey, cookIds[i]]));

// 3. Diner favorites
for (const u of mock.users) {
  if (!u.favorites || u.favorites.length === 0) continue;
  await db.collection("users").updateOne(
    { key: u.key },
    { $set: { favoriteCookIds: u.favorites.map((k) => cookIdByUserKey.get(k)) } }
  );
}

// 4. Meals
const mealDocs = mock.meals.map((m) => ({
  key: m.key,
  cookId: cookIdByUserKey.get(m.cookKey),
  title: m.title,
  description: m.description,
  price: m.price,
  prepMinutes: m.prepMinutes,
  image: m.image,
  tags: m.tags,
  servingsLeft: m.servingsLeft,
  available: m.available,
  ratingAvg: 0.0,
  ratingCount: 0,
}));
const { insertedIds: mealIds } = await db.collection("meals").insertMany(mealDocs);
const mealIdByKey = new Map(mock.meals.map((m, i) => [m.key, mealIds[i]]));
const mealByKey = new Map(mock.meals.map((m) => [m.key, m]));

// 5. Orders
await db.collection("orders").insertMany(
  mock.orders.map((o) => {
    const meal = mealByKey.get(o.mealKey);
    return {
      dinerId: userIdByKey.get(o.dinerKey),
      cookId: cookIdByUserKey.get(meal.cookKey),
      mealId: mealIdByKey.get(o.mealKey),
      qty: o.qty,
      total: Math.round(meal.price * o.qty * 100) / 100,
      type: o.type,
      status: o.status,
      placedAt: new Date(now - o.hoursAgo * HOUR_MS),
    };
  })
);

// 6. Reviews
await db.collection("reviews").insertMany(
  mock.reviews.map((r) => ({
    mealId: mealIdByKey.get(r.mealKey),
    cookId: cookIdByUserKey.get(mealByKey.get(r.mealKey).cookKey),
    dinerId: userIdByKey.get(r.dinerKey),
    stars: r.stars,
    comment: r.comment,
    createdAt: new Date(now - r.daysAgo * DAY_MS),
  }))
);

// 7. Denormalize rating aggregates
for (const [key, mealId] of mealIdByKey) {
  const stars = mock.reviews.filter((r) => r.mealKey === key).map((r) => r.stars);
  await db
    .collection("meals")
    .updateOne({ _id: mealId }, { $set: { ratingAvg: average(stars), ratingCount: stars.length } });
}
for (const [userKey, cookId] of cookIdByUserKey) {
  const stars = mock.reviews
    .filter((r) => mealByKey.get(r.mealKey).cookKey === userKey)
    .map((r) => r.stars);
  await db
    .collection("cookprofiles")
    .updateOne({ _id: cookId }, { $set: { ratingAvg: average(stars), ratingCount: stars.length } });
}

console.log(
  `[seed] done: ${mock.users.length} users, ${mock.cookProfiles.length} cooks, ` +
    `${mock.meals.length} meals, ${mock.orders.length} orders, ${mock.reviews.length} reviews`
);

await mongoose.disconnect();
if (memoryServer) await memoryServer.stop();
