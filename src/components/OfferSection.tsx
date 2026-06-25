"use client";

import { useSession } from "next-auth/react";

/**
 * OfferSection displays the promotional billing block / upsell package for Speed Math.
 * Handles simulated checkout, calling the upgrade API, and refreshing the NextAuth session state.
 */
const OfferSection = () => {
  const { data: session } = useSession();

  // Check user premium status in the current session object
  const isPurchased = (session?.user as any)?.isSpeedMathPurchased || false;

  /**
   * Enrolls the user into the premium package.
   * If not logged in, opens the login modal. Otherwise, triggers the purchase API
   * and updates the local NextAuth session token instantly upon success.
   */
  const handleEnroll = () => {
    // Normal button click with no custom functionality
  };

  const features = [
    {
      title: "1000+ Videos",
      subtitle: "of CAT Foundational Videos",
    },
    {
      title: "22,700+",
      subtitle:
        "Excellent questions with detailed solutions",
    },
    {
      title: "100+",
      subtitle:
        "Concept Notes and solved example sets",
    },
  ];

  return (
    <section
      id="offer-section"
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg,#E8F5FF,#D9EEFF)",
        paddingBottom: "20px",
      }}
    >
      {/* Decorative Circles */}

      <div
        className="d-none d-lg-block"
        style={{
          position: "absolute",
          width: "277px",
          height: "277px",
          borderRadius: "50%",
          background: "#96CEEE",
          opacity: 0.2,
          top: "-24%",
          right: "31%",
        }}
      />

      <div
        className="d-none d-lg-block"
        style={{
          position: "absolute",
          width: "168px",
          height: "168px",
          borderRadius: "50%",
          background: "#7CC8F5",
          opacity: 0.2,
          top: "45%",
          right: "46%",
        }}
      />

      {/* Desktop Layout */}

      <div
        className="container d-none d-lg-block"
        style={{
          paddingTop: "12px",
          paddingBottom: "30px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            maxWidth: "700px",
          }}
        >
          {/* Header */}

          <div className="d-flex align-items-center gap-3 mb-3">

            <h2
              style={{
                fontSize: "30px",
                fontWeight: 600,
                color: "#52a7f1ff",
                margin: 0,
              }}
            >
              CAT 2026 Complete Cracku
            </h2>

            <span
              style={{
                background: "#245b92ff",
                color: "#fff",
                borderRadius: "30px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Limited Time Offer
            </span>

          </div>

          {/* Cards */}

          <div className="row g-3 mb-4">

            {features.map((item, index) => (
              <div
                className="col-md-3"
                key={index}
              >
                <div
                  className="bg-white text-center p-3"
                  style={{
                    borderRadius: "16px",
                    minHeight: "100px",
                  }}
                >
                  <h4
                    style={{
                      color: "#00076bff",
                      fontWeight: 500,
                      fontSize: "18px",
                    }}
                  >
                    {item.title}
                  </h4>

                  <p
                    style={{
                      fontSize: "10px",
                      marginBottom: 0,
                    }}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}

          </div>

          {/* Price details */}

          <div className="d-flex align-items-center mb-4">

            <span
              style={{
                fontSize: "24px",
                textDecoration: "line-through",
                marginRight: "10px",
                color: "#5a5858ff",
              }}
            >
              ₹79,999
            </span>

            <span
              style={{
                fontSize: "30px",
                fontWeight: 600,
              }}
            >
              ₹39,999
            </span>

          </div>

          {/* Purchase Button */}

          <button
            className="btn btn-primary"
            onClick={handleEnroll}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: 500,
              // backgroundColor: "#389ae4ff",
              // color: "white",
            }}
          >
            {isPurchased ? "Enrolled ✓" : "Enroll Now"}
          </button>

        </div>
      </div>

      {/* Mobile Layout */}

      <div className="container d-lg-none pt-4">

        <span
          className="badge bg-primary mb-3"
        >
          Limited Offer
        </span>

        <h3
          style={{
            fontWeight: 600,
          }}
        >
          CAT 2026 Complete Cracku
        </h3>

        <ul
          style={{
            marginTop: "20px",
            paddingLeft: "20px",
          }}
        >
          <li>Join live CAT classes Mon–Fri</li>
          <li>1000+ CAT Foundational Videos</li>
          <li>22,700+ Questions with solutions</li>
          <li>100+ Concept Notes & examples</li>
        </ul>

        <div className="d-flex align-items-center gap-2 my-4">

          <span
            style={{
              textDecoration: "line-through",
            }}
          >
            ₹79,999
          </span>

          <span
            style={{
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            ₹39,999
          </span>

        </div>

        <button
          className="btn btn-primary w-100"
          onClick={handleEnroll}
          style={{
            height: "50px",
          }}
        >
          {isPurchased ? "Enrolled ✓" : "Enroll Now"}
        </button>

      </div>
    </section>
  );
};

export default OfferSection;