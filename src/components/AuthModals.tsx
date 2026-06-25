"use client";

import React, { useState } from "react";
import { useModals } from "./ModalContext";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaLock } from "react-icons/fa";

/**
 * AuthModals component co-locates overlays for Logging In, Registering,
 * and Premium paywall notifications, managing fields, validation, and loading animations.
 */
export default function AuthModals() {
  // Access modal state variables and togglers from the ModalContext
  const {
    isLoginOpen,
    isRegisterOpen,
    isPremiumOpen,
    closeLogin,
    closeRegister,
    closePremium,
    openLogin,
    openRegister,
  } = useModals();

  const router = useRouter();

  // Login form field input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration form field input states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Submit login details to NextAuth Credentials authentication provider
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false, // Prevent page reloads; handle errors in state
        email: loginEmail,
        password: loginPassword,
      });

      if (result?.error) {
        setLoginError(result.error);
      } else {
        closeLogin();
        router.refresh();
      }
    } catch (err: any) {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Perform email registration, check confirmation password alignment, and register new profile
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);

    // Front-end validator check
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match");
      setRegLoading(false);
      return;
    }

    try {
      const res = await fetch("/speed-math/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          confirmPassword: regConfirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || "Failed to register");
      } else {
        setRegSuccess("Account registered! You can login now.");
        // Automatically switch overlay views to login form after registration success
        setTimeout(() => {
          openLogin();
          setRegName("");
          setRegEmail("");
          setRegPassword("");
          setRegConfirmPassword("");
          setRegSuccess("");
        }, 1500);
      }
    } catch (err) {
      setRegError("Something went wrong. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  // Triggers third-party OAuth redirect via NextAuth Google provider configuration
  const handleGoogleLogin = () => {
    signIn("google");
  };

  if (!isLoginOpen && !isRegisterOpen && !isPremiumOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050, backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={() => {
          closeLogin();
          closeRegister();
          closePremium();
        }}
      />

      {isLoginOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold fs-4 pt-2 ms-2">Login to Practice</h5>
                <button
                  type="button"
                  className="btn-close me-2 mt-2"
                  onClick={closeLogin}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body px-4 py-3">
                {loginError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">Password</label>
                    <input
                      type="password"
                      className="form-control py-2"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold mb-3 mt-2"
                    disabled={loginLoading}
                    style={{ borderRadius: "8px" }}
                  >
                    {loginLoading ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div className="text-center my-3 position-relative">
                  <hr className="text-muted" />
                  <span
                    className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted fs-7"
                    style={{ fontSize: "13px" }}
                  >
                    or
                  </span>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="btn btn-outline-secondary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: "8px" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.44 3.77v3.13h3.92c2.29-2.11 3.57-5.21 3.57-8.75Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.92-3.13c-1.08.73-2.48 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.24C3.18 21.82 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.32 14.16a7.16 7.16 0 0 1 0-4.32V6.6H1.21a11.94 11.94 0 0 0 0 10.8l4.11-3.24Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.31 0 3.18 2.18 1.21 5.8l4.11 3.24c.94-2.85 3.57-4.96 6.68-4.96Z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="text-center mt-3 pt-2">
                  <span className="text-muted">Don't have an account? </span>
                  <button
                    onClick={openRegister}
                    className="btn btn-link p-0 fw-semibold text-decoration-none"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRegisterOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold fs-4 pt-2 ms-2">Create Account</h5>
                <button
                  type="button"
                  className="btn-close me-2 mt-2"
                  onClick={closeRegister}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body px-4 py-3">
                {regError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="alert alert-success py-2" role="alert">
                    {regSuccess}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit}>
                  <div className="mb-2">
                    <label className="form-label fw-semibold text-secondary mb-1">Full Name</label>
                    <input
                      type="text"
                      className="form-control py-2"
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold text-secondary mb-1">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="name@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold text-secondary mb-1">Password</label>
                    <input
                      type="password"
                      className="form-control py-2"
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary mb-1">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control py-2"
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold mb-2 mt-2"
                    disabled={regLoading}
                    style={{ borderRadius: "8px" }}
                  >
                    {regLoading ? "Registering..." : "Sign Up"}
                  </button>
                </form>

                <div className="text-center mt-3 pt-2">
                  <span className="text-muted">Already have an account? </span>
                  <button
                    onClick={openLogin}
                    className="btn btn-link p-0 fw-semibold text-decoration-none"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPremiumOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-center" style={{ borderRadius: "20px", overflow: "hidden" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #0B6CBF, #00B4D8)",
                  padding: "40px 20px",
                  color: "#fff",
                  position: "relative"
                }}
              >
                <button
                  type="button"
                  className="btn-close btn-close-white position-absolute"
                  style={{ top: "20px", right: "20px" }}
                  onClick={closePremium}
                  aria-label="Close"
                />
                <div
                  className="bg-white text-primary shadow d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "70px", height: "70px", borderRadius: "50%" }}
                >
                  <FaLock size={32} color="#0B6CBF" />
                </div>
                <h3 className="fw-bold m-0">Premium Access Required</h3>
                <p className="m-0 mt-2 opacity-90 text-light">Unlock all mathematical operations and higher difficulties</p>
              </div>

              <div className="modal-body p-4">
                <ul className="text-start mb-4 mx-auto" style={{ maxWidth: "320px", listStyleType: "none", paddingLeft: 0 }}>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="text-success fw-bold">✓</span>
                    <span>Unlock **Multiplication** and **Division**</span>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="text-success fw-bold">✓</span>
                    <span>Access **Medium** and **Hard** difficulty levels</span>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="text-success fw-bold">✓</span>
                    <span>10,000+ adaptive speed math questions</span>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="text-success fw-bold">✓</span>
                    <span>Detailed accuracy performance dashboard</span>
                  </li>
                </ul>

                <button
                  onClick={() => {
                    closePremium();
                    const offerSec = document.getElementById("offer-section");
                    if (offerSec) {
                      offerSec.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="btn btn-primary w-100 py-3 fw-bold fs-5 shadow-sm"
                  style={{ borderRadius: "12px" }}
                >
                  Get Premium Access Now
                </button>
                <button
                  onClick={closePremium}
                  className="btn btn-link text-muted mt-2 w-100 text-decoration-none fw-semibold"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
