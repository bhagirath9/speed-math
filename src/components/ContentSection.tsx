/**
 * ContentSection renders a static informational block explaining the concept of Speed Math,
 * highlighting its benefits (Time Management, Accuracy, Focus) for competitive exams like CAT.
 */
const ContentSection = () => {
  return (
    <section
      style={{
        paddingTop: "60px",
        paddingBottom: "60px",
      }}
    >
      <div className="container">

        <div className="row">

          {/* Left Content */}

          <div className="col-lg-8">

            {/* Heading */}

            <h2
              style={{
                fontSize: "42px",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "25px",
              }}
            >
              What Is Speed Math?
            </h2>

            {/* Content */}

            <div
              style={{
                fontSize: "16px",
                lineHeight: "28px",
                color: "#374151",
                maxWidth: "780px",
              }}
            >
              <p
                style={{
                  marginBottom: "20px",
                }}
              >
                Speed Math is the ability to perform
                mathematical calculations quickly and
                accurately, a crucial skill for
                competitive exams like the CAT exam,
                where time is a key factor.

                The Quantitative Aptitude section of
                the CAT tests both mathematical
                understanding and problem-solving
                speed.

                Speed Math can reduce the need for
                calculators and help candidates manage
                their time more effectively, leading
                to improved accuracy and higher
                scores.
              </p>

              <p
                style={{
                  marginBottom: "20px",
                }}
              >
                CAT aspirants should focus on Speed
                Math because it helps improve
                performance in several ways:
              </p>

              {/* Benefits */}

              <ul
                style={{
                  paddingLeft: "22px",
                }}
              >
                <li
                  style={{
                    marginBottom: "15px",
                  }}
                >
                  <strong>
                    Time Management:
                  </strong>{" "}
                  The ability to solve
                  problems faster offers a
                  significant advantage when
                  dealing with many questions
                  in limited time.
                </li>

                <li
                  style={{
                    marginBottom: "15px",
                  }}
                >
                  <strong>
                    Improved Accuracy:
                  </strong>{" "}
                  Speed Math is not just
                  about speed; accuracy is
                  equally important. These
                  techniques help you reach
                  the correct answer while
                  saving valuable time.
                </li>

                <li
                  style={{
                    marginBottom: "15px",
                  }}
                >
                  <strong>
                    Better Focus on Complex
                    Problems:
                  </strong>{" "}
                  By saving time on simpler
                  calculations, you can
                  devote more attention to
                  complex and
                  time-consuming questions.
                </li>
              </ul>

            </div>

          </div>

          {/* Empty Right Side */}

          <div className="col-lg-4 d-none d-lg-block"></div>

        </div>

      </div>
    </section>
  );
};

export default ContentSection;