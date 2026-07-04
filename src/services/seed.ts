import mockData from "../../db/mock-data.json";
import { CookProfile, Meal, Order, Review, User } from "./models";
import { computeAverage } from "./rating";

/**
 * Mock-data seeding engine.
 *
 * Reads db/mock-data.json (users, cook profiles, meals, orders, historical
 * reviews), inserts everything with real ObjectId relationships, then runs
 * the rating engine to denormalize per-meal and per-cook aggregates.
 *
 * `seedIfEmpty` is invoked automatically on first DB connection so the app
 * always boots populated; `reseed` wipes and rebuilds (used by db/seed.mjs).
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export async function seedIfEmpty(): Promise<boolean> {
  const existing = await User.estimatedDocumentCount();
  if (existing > 0) return false;
  await runSeed();
  return true;
}

export async function reseed(): Promise<void> {
  await Promise.all([
    User.deleteMany({}),
    CookProfile.deleteMany({}),
    Meal.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
  ]);
  await runSeed();
}

async function runSeed(): Promise<void> {
  console.log("[seed] populating mock data...");

  // 1. Users (favorites are resolved after cook profiles exist)
  const users = await User.insertMany(
    mockData.users.map((u) => ({
      key: u.key,
      name: u.name,
      email: u.email,
      role: u.role,
      addresses: u.addresses ?? [],
      favoriteCookIds: [],
      joinedAt: new Date(Date.now() - 120 * DAY_MS),
    }))
  );
  const userIdByKey = new Map(users.map((u) => [u.key, u._id]));

  // 2. Cook profiles
  const cooks = await CookProfile.insertMany(
    mockData.cookProfiles.map((c) => ({
      userId: userIdByKey.get(c.userKey),
      kitchenName: c.kitchenName,
      bio: c.bio,
      portrait: c.portrait,
      banner: c.banner,
      icon: c.icon,
      location: c.location,
      certifications: c.certifications,
      operatingHours: c.operatingHours,
      cuisines: c.cuisines,
      ratingAvg: 0.0,
      ratingCount: 0,
    }))
  );
  const cookIdByUserKey = new Map(
    mockData.cookProfiles.map((c, i) => [c.userKey, cooks[i]._id])
  );

  // 3. Diner favorites (cook keys -> profile ObjectIds)
  for (const u of mockData.users) {
    const favorites = "favorites" in u ? (u.favorites as string[]) : [];
    if (favorites.length === 0) continue;
    await User.updateOne(
      { key: u.key },
      { $set: { favoriteCookIds: favorites.map((k) => cookIdByUserKey.get(k)) } }
    );
  }

  // 4. Meals
  const meals = await Meal.insertMany(
    mockData.meals.map((m) => ({
      key: m.key,
      cookId: cookIdByUserKey.get(m.cookKey),
      title: m.title,
      description: m.description,
      price: m.price,
      prepMinutes: m.prepMinutes,
      image: m.image,
      photos: m.photos,
      tags: m.tags,
      servingsLeft: m.servingsLeft,
      available: m.available,
      ratingAvg: 0.0,
      ratingCount: 0,
    }))
  );
  const mealIdByKey = new Map(mockData.meals.map((m, i) => [m.key, meals[i]._id]));
  const mealByKey = new Map(mockData.meals.map((m) => [m.key, m]));

  // 5. Orders (history + live queue)
  await Order.insertMany(
    mockData.orders.map((o) => {
      const meal = mealByKey.get(o.mealKey)!;
      return {
        dinerId: userIdByKey.get(o.dinerKey),
        cookId: cookIdByUserKey.get(meal.cookKey),
        mealId: mealIdByKey.get(o.mealKey),
        qty: o.qty,
        total: Math.round(meal.price * o.qty * 100) / 100,
        type: o.type,
        status: o.status,
        placedAt: new Date(Date.now() - o.hoursAgo * HOUR_MS),
      };
    })
  );

  // 6. Historical reviews
  await Review.insertMany(
    mockData.reviews.map((r) => ({
      mealId: mealIdByKey.get(r.mealKey),
      cookId: cookIdByUserKey.get(mealByKey.get(r.mealKey)!.cookKey),
      dinerId: userIdByKey.get(r.dinerKey),
      stars: r.stars,
      comment: r.comment,
      createdAt: new Date(Date.now() - r.daysAgo * DAY_MS),
    }))
  );

  // 7. Denormalize rating aggregates via the rating engine
  for (const meal of meals) {
    await recomputeMealRating(meal._id);
  }
  for (const cook of cooks) {
    await recomputeCookRating(cook._id);
  }

  console.log(
    `[seed] done: ${users.length} users, ${cooks.length} cooks, ${meals.length} meals, ` +
      `${mockData.orders.length} orders, ${mockData.reviews.length} reviews`
  );
}

/** Recompute a meal's denormalized average from its reviews. */
export async function recomputeMealRating(mealId: unknown): Promise<void> {
  const reviews = await Review.find({ mealId }).select("stars").lean();
  const avg = computeAverage(reviews.map((r) => r.stars));
  await Meal.updateOne(
    { _id: mealId },
    { $set: { ratingAvg: avg, ratingCount: reviews.length } }
  );
}

/** Recompute a cook's denormalized average across all their reviews. */
export async function recomputeCookRating(cookId: unknown): Promise<void> {
  const reviews = await Review.find({ cookId }).select("stars").lean();
  const avg = computeAverage(reviews.map((r) => r.stars));
  await CookProfile.updateOne(
    { _id: cookId },
    { $set: { ratingAvg: avg, ratingCount: reviews.length } }
  );
}
