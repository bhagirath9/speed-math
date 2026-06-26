"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useModals } from "@/components/ModalContext";

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openLogin } = useModals();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  // Pre-populate fields when session is active
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  // Handle script load
  const handleScriptLoad = () => {
    setIsSdkLoaded(true);
    console.log("Cashfree SDK script loaded successfully.");
  };

  // Redirect to home if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      // Wait a moment and trigger login modal
      setTimeout(() => {
        openLogin();
      }, 500);
    }
  }, [status, router, openLogin]);

  // Form submit handler
  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!name.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Email Address is required.");
      return;
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!isSdkLoaded || !window.Cashfree) {
      setErrorMsg("Payment gateway is initializing, please try again in a few seconds.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Call our Next.js API to create order
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          courseName: "CAT 2026 Complete Cracku",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment order.");
      }

      // 2. Initialize Cashfree PG Web SDK
      const cashfree = window.Cashfree({
        mode: data.environment || "sandbox",
      });

      console.log("Cashfree SDK initialized in mode:", data.environment);

      // 3. Open Cashfree Checkout overlay/redirect page
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self", // Redirects user on checkout completion/failure
      });

    } catch (err: any) {
      console.error("Payment initialization failed:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary fw-semibold">Loading checkout details...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3 text-center">
        <h3 className="fw-bold mb-2">Access Denied</h3>
        <p className="text-muted mb-4">You need to be logged in to access the checkout. Redirecting you home...</p>
        <button onClick={() => router.push("/")} className="btn btn-primary px-4 py-2">
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Load Cashfree Web SDK v3 */}
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onLoad={handleScriptLoad}
        onError={() => console.error("Failed to load Cashfree script.")}
        strategy="afterInteractive"
      />

      <div
        className="min-vh-100 py-5"
        style={{
          background: "linear-gradient(135deg, #F3F9FD 0%, #E8F3FA 100%)",
          color: "#2C3E50",
        }}
      >
        <div className="container">
          <div className="row justify-content-center g-4">
            {/* Payment Form Container */}
            <div className="col-lg-6 col-md-8">
              <div
                className="card border-0 shadow-lg p-4 p-md-5"
                style={{
                  borderRadius: "24px",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="mb-4">
                  <span
                    className="badge mb-2 px-3 py-2 text-primary"
                    style={{
                      backgroundColor: "rgba(13, 110, 253, 0.1)",
                      borderRadius: "30px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Secure checkout
                  </span>
                  <h2 className="fw-bold m-0" style={{ color: "#00076b" }}>
                    Enrollment Form
                  </h2>
                  <p className="text-muted mt-1" style={{ fontSize: "14px" }}>
                    Enter your details to register and complete the purchase.
                  </p>
                </div>

                {errorMsg && (
                  <div className="alert alert-danger py-2 mb-4 d-flex align-items-center" role="alert" style={{ borderRadius: "10px", fontSize: "14px" }}>
                    <span className="me-2">⚠️</span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handlePayNow}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">FULL NAME</label>
                    <input
                      type="text"
                      className="form-control py-2"
                      placeholder="e.g. Bhagirath"
                      style={{ borderRadius: "10px" }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="name@example.com"
                      style={{ borderRadius: "10px", backgroundColor: "#f8f9fa" }}
                      value={email}
                      readOnly
                      required
                      disabled={true}
                    />
                    <div className="form-text text-muted" style={{ fontSize: "11px" }}>
                      Enrollment is linked with your account email.
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-secondary small">MOBILE NUMBER</label>
                    <div className="input-group">
                      <span className="input-group-text py-2" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px", backgroundColor: "#f8f9fa", fontWeight: 500 }}>
                        +91
                      </span>
                      <input
                        type="tel"
                        className="form-control py-2"
                        placeholder="9876543210"
                        style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: "12px", transition: "all 0.2s ease-in-out" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        Processing payment...
                      </>
                    ) : (
                      <>
                        Pay Now · ₹39,999
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted m-0" style={{ fontSize: "11px" }}>
                    By enrolling, you agree to the Terms of Service. Payments are processed securely via Cashfree PG.
                  </p>
                </div>
              </div>
            </div>

            {/* Course Summary Panel */}
            <div className="col-lg-4 col-md-8">
              <div
                className="card border-0 shadow-lg p-4"
                style={{
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, #00224D, #001026)",
                  color: "#ffffff",
                }}
              >
                <h4 className="fw-bold mb-4 border-bottom border-secondary pb-3 text-light">Order Summary</h4>

                <div className="mb-4">
                  <span className="text-secondary small fw-bold uppercase">COURSE</span>
                  <h5 className="fw-bold text-white mt-1">CAT 2026 Complete Cracku</h5>
                  <p className="text-light opacity-75 small mb-0 mt-2">
                    Comprehensive study bundle including live lectures, concept notes, 1000+ basic-to-advanced foundational videos, and practice assignments.
                  </p>
                </div>

                <div className="border-top border-secondary pt-3 mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="opacity-75 small">Base Price</span>
                    <span className="text-decoration-line-through opacity-50 small">₹79,999</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="opacity-75 small">Discount (50%)</span>
                    <span className="text-success small">-₹40,000</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="opacity-75 small">GST & taxes</span>
                    <span className="text-success small">Included</span>
                  </div>
                  <div className="d-flex justify-content-between pt-3 border-top border-secondary align-items-center">
                    <span className="fw-bold fs-5 text-light">Total Amount</span>
                    <span className="fw-bold fs-4 text-white">₹39,999</span>
                  </div>
                </div>

                <div
                  className="mt-4 p-3 rounded"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px dashed rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <div className="d-flex gap-2">
                    <span className="fs-5">🔒</span>
                    <div>
                      <p className="fw-semibold m-0" style={{ fontSize: "13px" }}>Secure Transaction</p>
                      <p className="m-0 text-white-50" style={{ fontSize: "11px" }}>Your connection is encrypted with standard SSL protocols.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
