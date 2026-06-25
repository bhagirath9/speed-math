import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * POST /speed-math/api/register
 * Handles user sign-up/registration. Validates request parameters, checks if
 * email is already registered, hashes passwords, and persists new user records.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    // Validate that all fields are filled
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify password matching
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Enforce password security policy (min length)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Prevent duplicate user signups by checking email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user with default purchase/membership status
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isSpeedMathPurchased: false,
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

