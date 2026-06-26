import crypto from "crypto";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "SANDBOX";

// Determine Cashfree API base URL based on environment setting
const getBaseUrl = () => {
  if (CASHFREE_ENV.toUpperCase() === "PRODUCTION") {
    return "https://api.cashfree.com/pg";
  }
  return "https://sandbox.cashfree.com/pg";
};

/**
 * Creates a payment order on Cashfree Payment Gateway.
 * Returns the order details, including the payment_session_id.
 */
export async function createCashfreeOrder(orderData: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree environment credentials are not defined in .env.local");
  }

  const url = `${getBaseUrl()}/orders`;
  const headers = {
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  };

  // customer_id needs to be alphanumeric. Replace non-alphanumeric chars with underscore.
  const customerId = orderData.customerEmail.replace(/[^a-zA-Z0-9]/g, "_");

  const body = {
    order_id: orderData.orderId,
    order_amount: orderData.amount,
    order_currency: "INR",
    customer_details: {
      customer_id: customerId,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
    },
    order_meta: {
      return_url: `${process.env.NEXTAUTH_URL}/success?order_id={order_id}`,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Cashfree Order Creation Error:", responseData);
    throw new Error(responseData.message || "Failed to create order on Cashfree");
  }

  return responseData;
}

/**
 * Retrieves details for a specific order from Cashfree Payment Gateway.
 */
export async function getCashfreeOrder(orderId: string) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree environment credentials are not defined in .env.local");
  }

  const url = `${getBaseUrl()}/orders/${orderId}`;
  const headers = {
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Cashfree Retrieve Order Error:", responseData);
    throw new Error(responseData.message || "Failed to retrieve order from Cashfree");
  }

  return responseData;
}

/**
 * Retrieves payment transactions for a specific order from Cashfree.
 */
export async function getCashfreeOrderPayments(orderId: string) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree environment credentials are not defined in .env.local");
  }

  const url = `${getBaseUrl()}/orders/${orderId}/payments`;
  const headers = {
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Cashfree Retrieve Payments Error:", responseData);
    throw new Error(responseData.message || "Failed to retrieve payments from Cashfree");
  }

  return responseData;
}

/**
 * Verifies the webhook signature sent by Cashfree to ensure request authenticity.
 * Cashfree signs webhook requests by concatenating x-webhook-timestamp header
 * and the raw request body string, then hashing it with the secret key using HMAC SHA256.
 */
export function verifyWebhookSignature(
  signature: string,
  timestamp: string,
  rawBody: string
): boolean {
  if (!CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree Secret Key is not defined in .env.local");
  }

  try {
    const signatureData = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac("sha256", CASHFREE_SECRET_KEY)
      .update(signatureData)
      .digest("base64");

    return computedSignature === signature;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return false;
  }
}
