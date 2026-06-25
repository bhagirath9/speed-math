/**
 * HeroSection renders the primary landing layout containing headings, 
 * introductory text, and promotional metrics (user count, active modules).
 */
const HeroSection = () => {
  return (
    <section
      style={{
        background:
          "linear-gradient(to right,#EAF7FF,#FFFFFF)",
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="container px-4 py-4 py-lg-5"
        style={{ maxWidth: "1364px" }}
      >
        <div className="row">

          {/* LEFT CONTENT */}

          <div className="col-lg-8 text-center text-lg-start">

            {/* Heading */}

            <h1 className="fw-bold lh-sm text-dark mb-4"
              style={{
                fontSize: "65px",
              }}
            >
              CAT{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg,#0B6CBF,#00B4D8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Speed Maths
              </span>
              <br />
              Practice Questions
            </h1>

            {/* Description */}

            <p className="text-secondary mb-4"
              style={{
                fontSize: "14px",
                lineHeight: "25px",
                maxWidth: "711px",
              }}
            >
              This tool, designed to test your
              adeptness in performing rapid and
              precise calculations such as addition,
              subtraction, division and multiplication
              on randomly generated numbers.

              This swift and engaging speed test is
              suitable for improving calculation speed.

              Simply choose the preferred options
              below and hit the Start button.

              Best of luck on your quest for numerical
              mastery!
            </p>

            {/* Stats Cards */}

            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">

              {/* Card 1 */}

              <div
                className="bg-white border shadow-sm"
                style={{
                  width: "177px",
                  height: "99px",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "36px",
                    color: "#111827",
                  }}
                >
                  20K+
                </span>

                <span
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Total number of users
                </span>
              </div>

              {/* Card 2 */}

              <div
                className="bg-white border shadow-sm"
                style={{
                  width: "177px",
                  height: "99px",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "36px",
                  }}
                >
                  4
                </span>

                <span
                  style={{
                    fontSize: "14px",
                  }}
                >
                  Operations available
                </span>
              </div>

              {/* Card 3 */}

              <div
                className="bg-white border shadow-sm"
                style={{
                  width: "177px",
                  height: "99px",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "36px",
                  }}
                >
                  3
                </span>

                <span
                  style={{
                    fontSize: "14px",
                  }}
                >
                  Difficulty levels
                </span>
              </div>

            </div>

          </div>

          {/* RIGHT SIDE EMPTY SPACE */}

          <div className="col-lg-4"></div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
