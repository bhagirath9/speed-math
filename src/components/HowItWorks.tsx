/**
 * HowItWorks renders a 3-step onboarding guide showing how the tool operates.
 * Features separate layouts for desktop (horizontal timeline) and mobile (vertical timeline).
 */
const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title:
        "Select the operations you want to practice",
    },
    {
      number: "2",
      title:
        "Answer questions as fast as you can",
    },
    {
      number: "3",
      title:
        "See your score, reflect on mistakes",
    },
  ];

  return (
    <section
      style={{
        background:
          "linear-gradient(90deg, #064e7eff, #021a2bff)",
        paddingTop: "8rem",
        paddingBottom: "185px",
      }}
    >
      <div className="container">
        <div className="row">

        {/* LEFT CONTENT */}

        <div className="col-lg-8 d-flex flex-column align-items-start">

          {/* Section Label */}

          <div
            className="d-flex align-items-center gap-2"
          >
            <div
              style={{
                width: "3px",
                height: "20px",
                background: "#FFC107",
                borderRadius: "20px",
              }}
            />

            <h3
              style={{
                color: "#fff",
                fontWeight: 700,
                margin: "0px !important",
                fontSize: "20px",
              }}
            >
              How It Works?
            </h3>
          </div>

          {/* Title */}

          <h2
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "40px",
            }}
          >
            Three steps to calculation mastery
          </h2>

          {/* Subtitle */}

          <p
            style={{
              color: "#fff",
              fontSize: "16px",
              marginBottom: "30px",
              opacity: 0.8,
            }}
          >
            No complicated setup. Just pick,
            play, and improve, every single day.
          </p>

          {/* Steps Wrapper */}

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "640px",
            }}
          >

            {/* Desktop Horizontal Line */}

            <div
              className="d-none d-lg-block"
              style={{
                position: "absolute",
                top: "53px",
                left: "106px",
                right: "106px",
                height: "2px",
                background:
                  "rgba(255,255,255,0.3)",
                zIndex: 1,
              }}
            />

            {/* Mobile Vertical Line */}

            <div
              className="d-lg-none"
              style={{
                position: "absolute",
                top: "43px",
                bottom: "43px",
                left: "21px",
                width: "2px",
                background:
                  "rgba(255,255,255,0.3)",
                zIndex: 1,
              }}
            />

            {/* DESKTOP */}

            <div className="d-none d-lg-flex justify-content-between position-relative">

              {steps.map((step) => (
                <div
                  key={step.number}
                  className="text-center"
                  style={{
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: "106px",
                      height: "106px",
                      borderRadius: "50%",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      margin:
                        "0 auto 25px auto",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "48px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#fff",
                      maxWidth: "176px",
                      margin: "0 auto",
                      lineHeight: "1.6",
                    }}
                  >
                    {step.title}
                  </p>
                </div>
              ))}

            </div>

            {/* MOBILE */}

            <div className="d-lg-none">

              {steps.map((step) => (
                <div
                  key={step.number}
                  className="d-flex align-items-center mb-4 position-relative"
                  style={{
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: "43px",
                      height: "43px",
                      borderRadius: "50%",
                      background: "#fff",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#fff",
                      marginLeft: "16px",
                      marginBottom: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    {step.title}
                  </p>
                </div>
              ))}

            </div>

          </div>

        </div>

        {/* RIGHT EMPTY COLUMN */}

        <div className="col-lg-4 d-none d-lg-block"></div>

        </div>
      </div>


    </section>
  );
};

export default HowItWorks;
