import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, User } from "@/services/models";
import { buildSessionPayload } from "@/services/session";
import mockData from "../../../../../db/mock-data.json";

export const dynamic = "force-dynamic";

const DEFAULT_HOURS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
  day,
  open: "11:00",
  close: "19:00",
  closed: false,
}));

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * POST /api/auth/signup — creates a real account in the database.
 * Body: { name, email, role: "diner" | "cook", kitchenName?, locationLabel? }
 * Kitchen accounts also get a CookProfile (default hours, location
 * jittered around the city center) so they appear on the map and in the
 * grid immediately.
 */
export async function POST(req: Request) {
  try {
    await connectDb();
    const body = (await req.json()) ?? {};
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const role = body.role === "cook" ? "cook" : body.role === "diner" ? "diner" : null;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email and account type are required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (await User.exists({ email })) {
      return NextResponse.json(
        { error: "An account with that email already exists — log in instead" },
        { status: 409 }
      );
    }

    const user = await User.create({
      key: `${slugify(name) || "user"}-${Date.now().toString(36)}`,
      name,
      email,
      role,
      addresses: [],
      favoriteCookIds: [],
    });

    if (role === "cook") {
      const center = mockData.city.center;
      await CookProfile.create({
        userId: user._id,
        kitchenName: (body.kitchenName ?? "").toString().trim() || `${name}'s Kitchen`,
        bio: "New kitchen on HomePlate — menu coming together now.",
        portrait: "",
        location: {
          lat: center.lat + (Math.random() - 0.5) * 0.05,
          lng: center.lng + (Math.random() - 0.5) * 0.05,
          label: (body.locationLabel ?? "").toString().trim() || mockData.city.name,
        },
        operatingHours: DEFAULT_HOURS,
        cuisines: ["Home Cooking"],
        ratingAvg: 0.0,
        ratingCount: 0,
      });
    }

    return NextResponse.json({ user: await buildSessionPayload(user) }, { status: 201 });
  } catch (err) {
    console.error("[api/auth/signup]", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
