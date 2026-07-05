import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schemas for the five core collections.
 * Guarded with `mongoose.models.X ||` so Next.js hot reload doesn't
 * attempt to recompile models that already exist.
 */

const AddressSchema = new Schema(
  {
    label: { type: String, required: true },
    line1: { type: String, required: true },
    city: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // stable slug (seed or signup)
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["diner", "cook"], required: true },
    addresses: { type: [AddressSchema], default: [] },
    favoriteCookIds: { type: [Schema.Types.ObjectId], ref: "CookProfile", default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const OperatingHoursSchema = new Schema(
  {
    day: { type: String, required: true }, // "Mon".."Sun"
    open: { type: String, default: "" }, // "11:00" (24h), empty when closed
    close: { type: String, default: "" },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const CookProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    kitchenName: { type: String, required: true },
    bio: { type: String, default: "" },
    portrait: { type: String, default: "" }, // the cook's headshot
    banner: { type: String, default: "" }, // wide hero image for the kitchen page
    icon: { type: String, default: "" }, // square kitchen mark, distinct from the banner
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      label: { type: String, default: "" },
    },
    operatingHours: { type: [OperatingHoursSchema], default: [] },
    cuisines: { type: [String], default: [] },
    // Denormalized aggregates maintained by the rating engine so map
    // markers and cards render without an aggregation query.
    ratingAvg: { type: Number, default: 0.0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const MealSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    cookId: { type: Schema.Types.ObjectId, ref: "CookProfile", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    prepMinutes: { type: Number, default: 30, min: 0 },
    image: { type: String, default: "" }, // primary photo (kept = photos[0] for card consumers)
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 2,
        message: "A dish can have at most two photos",
      },
    },
    tags: { type: [String], default: [] },
    servingsLeft: { type: Number, default: 0, min: 0 },
    available: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0.0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ReviewSchema = new Schema(
  {
    mealId: { type: Schema.Types.ObjectId, ref: "Meal", required: true, index: true },
    cookId: { type: Schema.Types.ObjectId, ref: "CookProfile", required: true, index: true },
    dinerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stars: { type: Number, required: true, min: 1.0, max: 5.0 },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "ready",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const OrderSchema = new Schema(
  {
    dinerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cookId: { type: Schema.Types.ObjectId, ref: "CookProfile", required: true, index: true },
    mealId: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
    qty: { type: Number, required: true, min: 1 },
    priceEach: { type: Number, default: 0, min: 0 }, // unit price at order time
    total: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
    note: { type: String, default: "" }, // diner's special request to the kitchen
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export type CookProfileDoc = InferSchemaType<typeof CookProfileSchema>;
export type MealDoc = InferSchemaType<typeof MealSchema>;
export type ReviewDoc = InferSchemaType<typeof ReviewSchema>;
export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const User: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);
export const CookProfile: Model<CookProfileDoc> =
  mongoose.models.CookProfile || mongoose.model<CookProfileDoc>("CookProfile", CookProfileSchema);
export const Meal: Model<MealDoc> =
  mongoose.models.Meal || mongoose.model<MealDoc>("Meal", MealSchema);
export const Review: Model<ReviewDoc> =
  mongoose.models.Review || mongoose.model<ReviewDoc>("Review", ReviewSchema);
export const Order: Model<OrderDoc> =
  mongoose.models.Order || mongoose.model<OrderDoc>("Order", OrderSchema);
