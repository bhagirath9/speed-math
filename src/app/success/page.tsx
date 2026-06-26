"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface PaymentDetails {
  name: string;
  email: string;
  courseName: string;
  coursePrice: number;
  orderId: string;
  paymentId: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionAmount: number;
}

function SuccessDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"SUCCESS" | "FAILED" | "PENDING" | "ERROR">("PENDING");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollCountRef = useRef(0);
  const maxPolls = 5; // Poll up to 5 times (7.5 seconds total)

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setStatus("ERROR");
      setErrorMsg("Invalid request. Missing order_id parameter.");
      return;
    }

    // Define function to call the verification API
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify-status?order_id=${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify transaction status.");
        }

        if (data.status === "SUCCESS") {
          setStatus("SUCCESS");
          setPaymentDetails(data.paymentRecord);
          setLoading(false);

          // Proactively trigger session refresh to update the isSpeedMathPurchased flag instantly in NextAuth cookies
          try {
            await update({
              isSpeedMathPurchased: true,
            });
            console.log("NextAuth local session token updated with premium course access.");
          } catch (sessionErr) {
            console.error("Failed to trigger next-auth token renewal:", sessionErr);
          }
        } else if (data.status === "FAILED") {
          setStatus("FAILED");
          setPaymentDetails(data.paymentRecord);
          setLoading(false);
        } else {
          // Status is PENDING
          if (pollCountRef.current < maxPolls) {
            pollCountRef.current += 1;
            console.log(`Order is pending. Retrying verification check (${pollCountRef.current}/${maxPolls})...`);
            setTimeout(verifyPayment, 1500); // Check again in 1.5 seconds
          } else {
            // Reached limit, show pending screen
            setStatus("PENDING");
            setPaymentDetails(data.paymentRecord);
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Verification poll attempt error:", err);
        setLoading(false);
        setStatus("ERROR");
        setErrorMsg(err.message || "An unexpected error occurred during payment verification.");
      }
    };

    verifyPayment();
  }, [orderId, update]);

  // Redirect back to landing page on failure to reload and retry
  useEffect(() => {
    if (status === "FAILED") {
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Loading Screen
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="spinner-border text-primary mb-4" role="status" style={{ width: "3.5rem", height: "3.5rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="fw-bold text-dark mb-2">Verifying Your Payment</h4>
        <p className="text-muted text-center px-3 small">
          Please do not refresh or close this window. We are confirming transaction authorization with the bank...
        </p>
      </div>
    );
  }

  // Error Screen
  if (status === "ERROR") {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3 text-center">
        <div className="bg-danger-subtle text-danger rounded-circle p-3 mb-4 d-inline-flex justify-content-center align-items-center" style={{ width: "80px", height: "80px" }}>
          <span className="fs-1">❌</span>
        </div>
        <h2 className="fw-bold mb-2 text-danger">Verification Error</h2>
        <p className="text-secondary mb-4 max-width-500">{errorMsg}</p>
        <Link href="/" className="btn btn-primary px-4 py-2" style={{ borderRadius: "10px" }}>
          Go to Home Page
        </Link>
      </div>
    );
  }

  // Payment Failed Screen
  if (status === "FAILED") {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3 text-center">
        <div className="bg-danger-subtle text-danger rounded-circle p-3 mb-4 d-inline-flex justify-content-center align-items-center" style={{ width: "80px", height: "80px" }}>
          <span className="fs-1">⚠️</span>
        </div>
        <h2 className="fw-bold mb-2 text-danger">Payment Failed</h2>
        <p className="text-secondary mb-3" style={{ maxWidth: "450px" }}>
          Unfortunately, your payment attempt could not be processed. If money was debited, it will be refunded automatically by your bank within 5-7 business days.
        </p>
        <p className="text-muted mb-4 small fw-semibold text-danger">
          Redirecting you back to the course page... The page will refresh automatically in a few seconds.
        </p>

        {paymentDetails && (
          <div className="card border-0 shadow-sm p-4 text-start mb-4 bg-white" style={{ borderRadius: "16px", minWidth: "320px", maxWidth: "400px" }}>
            <p className="text-muted small mb-2 text-center border-bottom pb-2">TRANSACTION DETAILS</p>
            <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Order ID:</span><span className="fw-semibold">{paymentDetails.orderId}</span></div>
            <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Course:</span><span className="fw-semibold">{paymentDetails.courseName}</span></div>
            <div className="d-flex justify-content-between small"><span className="text-muted">Amount:</span><span className="fw-semibold">₹{paymentDetails.transactionAmount}</span></div>
          </div>
        )}

        <div className="d-flex gap-3">
          <Link href="/payment" className="btn btn-primary px-4 py-2" style={{ borderRadius: "10px" }}>
            Retry Checkout
          </Link>
          <Link href="/" className="btn btn-outline-secondary px-4 py-2" style={{ borderRadius: "10px" }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Payment Pending Screen
  if (status === "PENDING") {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3 text-center">
        <div className="bg-warning-subtle text-warning rounded-circle p-3 mb-4 d-inline-flex justify-content-center align-items-center" style={{ width: "80px", height: "80px" }}>
          <span className="fs-1">⏳</span>
        </div>
        <h2 className="fw-bold mb-2 text-warning">Payment Awaiting Confirmation</h2>
        <p className="text-secondary mb-4" style={{ maxWidth: "450px" }}>
          Your payment verification is taking slightly longer than usual. Please check back in a few minutes, or reload this page.
        </p>

        {paymentDetails && (
          <div className="card border-0 shadow-sm p-4 text-start mb-4 bg-white" style={{ borderRadius: "16px", minWidth: "320px", maxWidth: "400px" }}>
            <p className="text-muted small mb-2 text-center border-bottom pb-2">TRANSACTION DETAILS</p>
            <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Order ID:</span><span className="fw-semibold">{paymentDetails.orderId}</span></div>
            <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Course:</span><span className="fw-semibold">{paymentDetails.courseName}</span></div>
            <div className="d-flex justify-content-between small"><span className="text-muted">Status:</span><span className="fw-semibold badge bg-warning text-dark">PENDING</span></div>
          </div>
        )}

        <div className="d-flex gap-3">
          <button onClick={() => window.location.reload()} className="btn btn-warning text-dark px-4 py-2" style={{ borderRadius: "10px", fontWeight: 600 }}>
            Check Status Again
          </button>
          <Link href="/" className="btn btn-outline-secondary px-4 py-2" style={{ borderRadius: "10px" }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Payment Success Screen
  return (
    <div
      className="min-vh-100 py-5 d-flex align-items-center"
      style={{
        background: "linear-gradient(135deg, #E6F4EA 0%, #C4ECD4 100%)",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 text-center">
            {/* Success Card */}
            <div
              className="card border-0 shadow-lg p-4 p-md-5"
              style={{
                borderRadius: "28px",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(15px)",
              }}
            >
              {/* Success Badge */}
              <div
                className="mx-auto bg-success text-white shadow d-flex align-items-center justify-content-center mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  fontSize: "36px",
                  animation: "bounce 1s infinite alternate",
                }}
              >
                ✓
              </div>

              <h2 className="fw-bold m-0" style={{ color: "#00076b", fontSize: "28px" }}>
                Payment Successful!
              </h2>
              <p className="text-success fw-semibold mt-1 mb-4" style={{ fontSize: "15px" }}>
                You are now enrolled in the course.
              </p>

              {paymentDetails && (
                <div
                  className="p-3 p-md-4 mb-4 rounded-3 text-start"
                  style={{
                    backgroundColor: "rgba(13, 110, 253, 0.03)",
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <p className="text-muted small fw-bold mb-3 border-bottom pb-2">ENROLLMENT RECEIPT</p>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">Enrolled User</span>
                    <span className="fw-semibold text-dark">{paymentDetails.name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">Email</span>
                    <span className="fw-semibold text-dark text-break" style={{ maxWidth: "200px" }}>{paymentDetails.email}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">Course Name</span>
                    <span className="fw-semibold text-primary">{paymentDetails.courseName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">Order ID</span>
                    <span className="fw-semibold text-dark text-break" style={{ maxWidth: "200px" }}>{paymentDetails.orderId}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">Payment ID</span>
                    <span className="fw-semibold text-dark text-break" style={{ maxWidth: "200px" }}>{paymentDetails.paymentId}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">Payment Method</span>
                    <span className="fw-semibold text-dark uppercase">{paymentDetails.paymentMethod || "UPI/Card"}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-10 align-items-center">
                    <span className="fw-bold text-dark">Amount Paid</span>
                    <span className="fw-bold fs-5 text-primary">₹{paymentDetails.transactionAmount}</span>
                  </div>
                </div>
              )}

              <div className="p-3 mb-4 rounded-3 text-start bg-success bg-opacity-10 text-success-emphasis border border-success border-opacity-25" style={{ fontSize: "13px" }}>
                🎯 <strong>Instant Access Granted:</strong> All restricted mathematical operations, CAT foundational videos, notes, and higher difficulty levels are now unlocked. You do not need any manual approvals.
              </div>

              <div className="d-flex flex-column gap-2">
                <Link
                  href="/"
                  className="btn btn-primary py-3 fw-bold shadow-sm"
                  style={{ borderRadius: "12px", fontSize: "16px" }}
                >
                  Start Practicing Now
                </Link>
                <Link
                  href="/"
                  className="btn btn-link text-decoration-none text-secondary fw-semibold btn-sm"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100" style={{ backgroundColor: "#F8FAFC" }}>
          <div className="spinner-border text-primary mb-4" role="status" style={{ width: "3.5rem", height: "3.5rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-dark mb-2">Initializing Payment Verification</h4>
          <p className="text-muted text-center px-3 small">Please wait while we connect to verify transaction details...</p>
        </div>
      }
    >
      <SuccessDetails />
    </Suspense>
  );
}
