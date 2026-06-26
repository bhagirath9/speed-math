import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { createCashfreeOrder } from "@/lib/cashfree";

// Server-defined absolute source of truth for course pricing
const COURSE_PRICES: Record<string, number> = {
  "CAT 2026 Complete Cracku": 39999,
  "Speed Math Premium": 39999,
};

/**
 * POST /api/payment/create-order
 * Handles the payment order initialization on the server.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    // 2. Parse request parameters
    const body = await req.json();
    const { name, email, phone, courseName } = body;

    // 3. Validation
    if (!name || !email || !phone || !courseName) {
      return NextResponse.json(
        { error: "All fields (name, email, phone, courseName) are required." },
        { status: 400 }
      );
    }

    // Email matching security check: The logged-in user must match the checkout email
    if (session.user.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Session email mismatch. Checkout email must match your logged in account." },
        { status: 400 }
      );
    }

    // 10-digit mobile number validator
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid mobile number. Please enter a valid 10-digit Indian phone number." },
        { status: 400 }
      );
    }

    // Amount override from server config (protects against frontend alteration tampering)
    const serverPrice = COURSE_PRICES[courseName];
    if (!serverPrice) {
      return NextResponse.json(
        { error: `Invalid course selection: ${courseName}` },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the user to ensure account profile exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "User profile not found in database." },
        { status: 404 }
      );
    }

    // 4. Double purchase guard (check user account flag and existing Payment document)
    if (user.isSpeedMathPurchased) {
      return NextResponse.json(
        { error: "You are already enrolled in this course.", alreadyEnrolled: true },
        { status: 400 }
      );
    }

    const existingPayment = await Payment.findOne({
      email: email.toLowerCase(),
      courseName,
    });

    if (existingPayment && (existingPayment.hasAccess || existingPayment.enrollmentStatus === "ACTIVE")) {
      // Auto-reconcile user model premium flag if database mismatch occurs
      user.isSpeedMathPurchased = true;
      await user.save();

      return NextResponse.json(
        { error: "You are already enrolled in this course. Access granted.", alreadyEnrolled: true },
        { status: 400 }
      );
    }

    // 5. Generate unique Order ID for this checkout attempt
    const uniqueId = Math.floor(100000 + Math.random() * 900000);
    const orderId = `order_sm_${Date.now()}_${uniqueId}`;

    // 6. Upsert the single Payment document per user/course and log the attempt
    let paymentRecord;
    try {
      paymentRecord = await Payment.findOneAndUpdate(
        { email: email.toLowerCase(), courseName },
        {
          $set: {
            name,
            phone,
            coursePrice: serverPrice,
            orderId,
            paymentStatus: "PENDING",
            transactionAmount: serverPrice,
            hasAccess: false,
            enrollmentStatus: "INACTIVE",
          },
          $push: {
            attempts: {
              orderId,
              paymentStatus: "PENDING",
              transactionAmount: serverPrice,
              paymentId: "",
              paymentMethod: "",
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (dbErr: any) {
      console.error("Database upsert error during order creation:", dbErr);
      return NextResponse.json(
        { error: "Database transaction failed. Please try again." },
        { status: 500 }
      );
    }

    // 7. Request payment order creation from Cashfree
    let cashfreeOrder;
    try {
      cashfreeOrder = await createCashfreeOrder({
        orderId,
        amount: serverPrice,
        customerName: name,
        customerEmail: email.toLowerCase(),
        customerPhone: phone,
      });
    } catch (cfError: any) {
      // Update top-level status and attempt status to FAILED in case of connection failure
      if (paymentRecord) {
        paymentRecord.paymentStatus = "FAILED";
        const attempt = paymentRecord.attempts.find((a: any) => a.orderId === orderId);
        if (attempt) {
          attempt.paymentStatus = "FAILED";
        }
        await paymentRecord.save();
      }
      throw cfError;
    }

    // 8. Return credentials for checkout redirection
    return NextResponse.json(
      {
        paymentSessionId: cashfreeOrder.payment_session_id,
        orderId: cashfreeOrder.order_id,
        status: cashfreeOrder.order_status,
        environment: process.env.CASHFREE_ENV?.toLowerCase() === "production" ? "production" : "sandbox",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize checkout." },
      { status: 500 }
    );
  }
}
