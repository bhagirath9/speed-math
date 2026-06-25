"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useModals } from "./ModalContext";


const Navbar = () => {
  const { data: session } = useSession();
  const { openLogin } = useModals();



  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top"
    >
      <div className="container">

        {/* Logo redirecting to homepage */}
        <Link
          href="/"
          className="navbar-brand fw-bold"
          style={{
            fontSize: "24px",
            color: "#0d6efd",
          }}
        >
          Speed Math
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu Navigation Items */}
        <div
          className="collapse navbar-collapse"
          id="navbarContent"
        >
          <ul className="navbar-nav ms-auto align-items-center">

            {session ? (
              <>
                {/* User information message and membership tier tag */}
                <li className="nav-item me-3 text-secondary" style={{ fontSize: "14px", fontWeight: 500 }}>
                  Hi, {session.user?.name || session.user?.email}
                </li>
                {/* Logout Action Button */}
                <li className="nav-item">
                  <button
                    onClick={() => signOut({ callbackUrl: "/speed-math" })}
                    className="btn btn-outline-danger btn-sm"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              // Login/Sign-up CTA trigger
              <li className="nav-item">
                <button
                  onClick={openLogin}
                  className="nav-link btn btn-link text-decoration-none"
                  style={{ border: "none", background: "none" }}
                >
                  Login
                </button>
              </li>
            )}

          </ul>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
