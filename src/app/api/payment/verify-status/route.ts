import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { getCashfreeOrder, getCashfreeOrderPayments } from "@/lib/cashfree";

/**
 * GET /api/payment/verify-status?order_id=xyz
 * Returns the verified status of a payment order.
 * If the status is PENDING in the DB, it queries the Cashfree API to verify,
 * updates the database (including user enrollment), and returns the updated status.
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    // 2. Retrieve order_id from search parameters
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id query parameter." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 3. Find the payment transaction record in MongoDB (searching by attempts list order ID)
    const paymentRecord = await Payment.findOne({
      $or: [{ orderId }, { "attempts.orderId": orderId }]
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Security check: Verify that the current user owns this payment record
    if (paymentRecord.email.toLowerCase() !== session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Access Denied. You do not have permission to view this payment status." },
        { status: 403 }
      );
    }

    // Ensure attempts array is initialized (resilience for cached mongoose models in dev mode)
    if (!paymentRecord.attempts) {
      paymentRecord.attempts = [] as any;
    }

    // Find the current attempt we are verifying inside the attempts array
    const attemptIndex = paymentRecord.attempts.findIndex((a: any) => a.orderId === orderId);
    const attempt = attemptIndex !== -1 ? paymentRecord.attempts[attemptIndex] : null;

    // Check if the current order ID represents the latest active checkout attempt
    const isLatestAttempt = paymentRecord.orderId === orderId;

    // If the specific attempt is already processed as SUCCESS or FAILED in database, return directly
    if (attempt && attempt.paymentStatus === "SUCCESS") {
      return NextResponse.json({ status: "SUCCESS", paymentRecord });
    }
    if (attempt && attempt.paymentStatus === "FAILED") {
      return NextResponse.json({ status: "FAILED", paymentRecord });
    }

    // 4. Status of this attempt is PENDING, poll Cashfree API for latest status
    console.log(`Polling Cashfree API for status of order: ${orderId}`);
    const cfOrder = await getCashfreeOrder(orderId);

    if (cfOrder.order_status === "PAID") {
      // Fetch details of successful payment transaction
      const payments = await getCashfreeOrderPayments(orderId);
      const successfulPayment = Array.isArray(payments)
        ? payments.find((p: any) => p.payment_status === "SUCCESS")
        : null;

      // Extract payment details
      const paymentId = successfulPayment?.cf_payment_id?.toString() || "";
      const paymentMethod = successfulPayment
        ? Object.keys(successfulPayment.payment_method || {})[0] || ""
        : "";
      const amountPaid = successfulPayment?.payment_amount || cfOrder.order_amount;
      const paidAtTime = successfulPayment?.payment_time
        ? new Date(successfulPayment.payment_time)
        : new Date();

      // A. Update the specific attempt inside the history array, or push it if missing
      if (attemptIndex !== -1) {
        paymentRecord.attempts[attemptIndex].paymentStatus = "SUCCESS";
        paymentRecord.attempts[attemptIndex].paymentId = paymentId;
        paymentRecord.attempts[attemptIndex].paymentMethod = paymentMethod;
        paymentRecord.attempts[attemptIndex].paidAt = paidAtTime;
      } else {
        paymentRecord.attempts.push({
          orderId,
          paymentStatus: "SUCCESS",
          paymentId,
          paymentMethod,
          transactionAmount: amountPaid,
          paidAt: paidAtTime,
        });
      }

      // B. If it is the latest checkout attempt, overwrite top-level fields
      if (isLatestAttempt) {
        paymentRecord.paymentStatus = "SUCCESS";
        paymentRecord.paymentId = paymentId;
        paymentRecord.paymentMethod = paymentMethod;
        paymentRecord.transactionAmount = amountPaid;
        paymentRecord.paidAt = paidAtTime;
        paymentRecord.hasAccess = true;
        paymentRecord.enrollmentStatus = "ACTIVE";
      } else {
        // Safely set access flag if an older attempt is verified as successful
        paymentRecord.hasAccess = true;
        paymentRecord.enrollmentStatus = "ACTIVE";
      }

      // Force Mongoose to recognize updates to nested schema arrays
      paymentRecord.markModified("attempts");
      await paymentRecord.save();

      // Automatically enroll the user by updating their isSpeedMathPurchased flag
      const user = await User.findOne({ email: paymentRecord.email.toLowerCase() });
      if (user) {
        user.isSpeedMathPurchased = true;
        await user.save();
        console.log(`Successfully enrolled user ${user.email} in Course: ${paymentRecord.courseName}`);
      }

      return NextResponse.json({ status: "SUCCESS", paymentRecord });
    } else if (cfOrder.order_status === "EXPIRED" || cfOrder.order_status === "TERMINATED") {
      // A. Update the specific attempt inside the history array, or push it if missing
      if (attemptIndex !== -1) {
        paymentRecord.attempts[attemptIndex].paymentStatus = "FAILED";
      } else {
        paymentRecord.attempts.push({
          orderId,
          paymentStatus: "FAILED",
          transactionAmount: paymentRecord.transactionAmount || cfOrder.order_amount,
        });
      }

      // B. If it is the latest checkout attempt, overwrite top-level fields
      if (isLatestAttempt) {
        paymentRecord.paymentStatus = "FAILED";
        // Do not revoke access if a previous checkout attempt had already succeeded
        if (paymentRecord.enrollmentStatus !== "ACTIVE") {
          paymentRecord.hasAccess = false;
          paymentRecord.enrollmentStatus = "INACTIVE";
        }
      }

      paymentRecord.markModified("attempts");
      await paymentRecord.save();

      return NextResponse.json({ status: "FAILED", paymentRecord });
    }

    // If order is still ACTIVE but unpaid
    return NextResponse.json({ status: "PENDING", paymentRecord });
  } catch (error: any) {
    console.error("Verify Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment status." },
      { status: 500 }
    );
  }
}
