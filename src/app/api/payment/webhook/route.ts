import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { verifyWebhookSignature } from "@/lib/cashfree";

/**
 * POST /api/payment/webhook
 * Cashfree calls this webhook endpoint to notify transaction completions.
 */
export async function POST(req: Request) {
  try {
    const headers = req.headers;
    const signature = headers.get("x-webhook-signature") || "";
    const timestamp = headers.get("x-webhook-timestamp") || "";

    // 1. Get raw request body string for signature calculation
    const rawBody = await req.text();

    console.log("Cashfree Webhook received with timestamp:", timestamp);
    console.log("Webhook body payload:", rawBody);

    // 2. Cryptographic signature check for request integrity validation
    const isValid = verifyWebhookSignature(signature, timestamp, rawBody);
    if (!isValid) {
      console.error("Webhook signature mismatch validation failed!");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 3. Parse validated request payload
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Invalid JSON body format" },
        { status: 400 }
      );
    }

    // Adapt to Cashfree API webhook versions (handling both nested data structures and flat structures)
    const orderId = body.data?.order?.order_id || body.order_id;
    const paymentStatus = body.data?.payment?.payment_status || body.payment_status;
    const paymentId = body.data?.payment?.cf_payment_id?.toString() || body.cf_payment_id?.toString() || "";
    const transactionAmount = body.data?.payment?.payment_amount || body.payment_amount || 0;
    const paymentTime = body.data?.payment?.payment_time || body.payment_time;
    const paymentMethodObj = body.data?.payment?.payment_method || body.payment_method;
    const paymentMethod = paymentMethodObj ? Object.keys(paymentMethodObj)[0] || "" : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order details inside payload." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 4. Find the matching Payment record checking both top-level and historical attempts array
    const payment = await Payment.findOne({
      $or: [{ orderId }, { "attempts.orderId": orderId }]
    });

    if (!payment) {
      console.warn(`Payment transaction logs for order ID: ${orderId} not found in database.`);
      return NextResponse.json(
        { error: "Associated transaction order not found" },
        { status: 404 }
      );
    }

    // Ensure attempts array is initialized (resilience for cached mongoose models in dev mode)
    if (!payment.attempts) {
      payment.attempts = [] as any;
    }

    // Find the current attempt index in the history array
    const attemptIndex = payment.attempts.findIndex((a: any) => a.orderId === orderId);
    
    // Check if the current order represents the latest active checkout attempt
    const isLatestAttempt = payment.orderId === orderId;

    // If this specific attempt has already been processed as SUCCESS, skip and return OK
    if (attemptIndex !== -1 && payment.attempts[attemptIndex].paymentStatus === "SUCCESS") {
      console.log(`Order ID: ${orderId} attempt already processed successfully.`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 5. Update based on transaction status
    if (paymentStatus === "SUCCESS") {
      console.log(`Payment success webhook for Order ID: ${orderId}. Processing enrollment...`);

      // A. Update the specific attempt inside the history array, or push it if missing
      if (attemptIndex !== -1) {
        payment.attempts[attemptIndex].paymentStatus = "SUCCESS";
        payment.attempts[attemptIndex].paymentId = paymentId;
        payment.attempts[attemptIndex].paymentMethod = paymentMethod;
        payment.attempts[attemptIndex].paidAt = paymentTime ? new Date(paymentTime) : new Date();
      } else {
        payment.attempts.push({
          orderId,
          paymentStatus: "SUCCESS",
          paymentId,
          paymentMethod,
          transactionAmount: transactionAmount || payment.transactionAmount,
          paidAt: paymentTime ? new Date(paymentTime) : new Date(),
        });
      }

      // B. Overwrite top level details if this order represents the latest checkout session
      if (isLatestAttempt) {
        payment.paymentStatus = "SUCCESS";
        payment.paymentId = paymentId;
        payment.paymentMethod = paymentMethod;
        payment.transactionAmount = transactionAmount || payment.transactionAmount;
        payment.paidAt = paymentTime ? new Date(paymentTime) : new Date();
        payment.hasAccess = true;
        payment.enrollmentStatus = "ACTIVE";
      } else {
        // Grant access in case a historical attempt succeeded
        payment.hasAccess = true;
        payment.enrollmentStatus = "ACTIVE";
      }

      payment.markModified("attempts");
      await payment.save();

      // Find user and grant course access
      const user = await User.findOne({ email: payment.email.toLowerCase() });
      if (user) {
        user.isSpeedMathPurchased = true;
        await user.save();
        console.log(`User ${user.email} successfully upgraded to Premium Course Access.`);
      } else {
        console.error(`User profile for email ${payment.email} not found during enrollment upgrade.`);
      }
    } else if (paymentStatus === "FAILED" || paymentStatus === "USER_DROPPED") {
      console.log(`Payment failed/dropped webhook for Order ID: ${orderId}.`);
      
      // A. Update specific attempt status, or push if missing
      if (attemptIndex !== -1) {
        payment.attempts[attemptIndex].paymentStatus = "FAILED";
      } else {
        payment.attempts.push({
          orderId,
          paymentStatus: "FAILED",
          transactionAmount: transactionAmount || payment.transactionAmount,
        });
      }

      // B. Overwrite top level details if latest attempt
      if (isLatestAttempt) {
        payment.paymentStatus = "FAILED";
        // Do not revoke access if a previous checkout had already succeeded
        if (payment.enrollmentStatus !== "ACTIVE") {
          payment.hasAccess = false;
          payment.enrollmentStatus = "INACTIVE";
        }
      }

      payment.markModified("attempts");
      await payment.save();
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook event" },
      { status: 500 }
    );
  }
}
