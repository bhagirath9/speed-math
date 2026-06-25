import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * POST /speed-math/api/purchase
 * Simulates a successful mock payment processing flow by finding the user
 * and updating the `isSpeedMathPurchased` flag to true in MongoDB.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    // Validate that the request payload contains a userId
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user in the database
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Grant access to Speed Math content by setting the purchase flag
    user.isSpeedMathPurchased = true;
    await user.save();

    return NextResponse.json(
      { message: "Simulated payment successful! Speed Math package upgraded.", isSpeedMathPurchased: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

