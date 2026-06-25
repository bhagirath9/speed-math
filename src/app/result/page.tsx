"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Interface mapping the properties returned by the practice session completion
interface ResultData {
  operation: string;
  difficulty: string;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number;
  timeTaken: number;
}

/**
 * ResultPage compiles and displays a report card of the user's completed practice session.
 * Includes dynamic SVG progress circle charts and actions to quick-start another session.
 */
export default function ResultPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State management
  const [result, setResult] = useState<ResultData | null>(null);
  const [playLoading, setPlayLoading] = useState(false); // Handles loading spinner for generating a new session

  // Validate authenticated status and extract the session summary from localStorage
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    const localData = localStorage.getItem("speed_math_last_result");
    if (!localData) {
      router.push("/");
      return;
    }

    try {
      setResult(JSON.parse(localData));
    } catch (e) {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !result) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  /**
   * Triggers a new API call to create a practice session using the same parameters,
   * stores new question batch details, and redirects the user to /practice.
   */
  const handlePlayAgain = async () => {
    if (!session || playLoading) return;
    setPlayLoading(true);

    try {
      const res = await fetch("/speed-math/api/start-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session.user as any).id,
          operation: result.operation,
          difficulty: result.difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start practice session");
      } else {
        localStorage.setItem("speed_math_practice_session", JSON.stringify({
          sessionId: data.sessionId,
          questions: data.questions,
          operation: result.operation,
          difficulty: result.difficulty,
        }));
        router.push("/practice");
      }
    } catch (err) {
      alert("Failed to start new practice session. Please try again.");
    } finally {
      setPlayLoading(false);
    }
  };

  // SVG layout configurations for the circular accuracy progress ring
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Calculate dash offset representing accuracy level
  const strokeDashoffset = circumference - (result.accuracyPercentage / 100) * circumference;

  // Determine indicator ring color based on performance thresholds
  const circleColor =
    result.accuracyPercentage >= 80
      ? "#10B981" // Green for excellent performance
      : result.accuracyPercentage >= 50
      ? "#F59E0B" // Amber/Yellow for moderate performance
      : "#EF4444"; // Red for weak performance

  return (
    <div className="min-vh-100 bg-light py-5 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg p-4 p-md-5" style={{ borderRadius: "24px" }}>
              <div className="card-body text-center">
                <span className="badge bg-light text-uppercase text-secondary border px-3 py-2 mb-4">
                  Session Completed
                </span>

                <h2 className="fw-bold mb-4" style={{ color: "#1e293b" }}>
                  Your Speed Math Report
                </h2>

                <div className="position-relative d-inline-block mb-5">
                  <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="transparent"
                      stroke={circleColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s ease-out" }}
                    />
                  </svg>
                  <div
                    className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center justify-content-center"
                    style={{ width: "120px", height: "120px" }}
                  >
                    <span className="fs-1 fw-bold font-monospace" style={{ color: "#1e293b", lineHeight: 1 }}>
                      {result.accuracyPercentage}%
                    </span>
                    <span className="text-muted fw-semibold mt-1" style={{ fontSize: "12px" }}>
                      Accuracy
                    </span>
                  </div>
                </div>

                <div className="row g-3 mb-5 text-start">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-4 border d-flex align-items-center gap-3">
                      <div
                        className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center fw-bold text-success"
                        style={{ width: "42px", height: "42px", flexShrink: 0 }}
                      >
                        ✓
                      </div>
                      <div>
                        <small className="text-muted d-block fw-semibold" style={{ fontSize: "11px" }}>
                          CORRECT
                        </small>
                        <span className="fs-5 fw-bold font-monospace text-success">{result.correctAnswers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 bg-light rounded-4 border d-flex align-items-center gap-3">
                      <div
                        className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center fw-bold text-danger"
                        style={{ width: "42px", height: "42px", flexShrink: 0 }}
                      >
                        ✗
                      </div>
                      <div>
                        <small className="text-muted d-block fw-semibold" style={{ fontSize: "11px" }}>
                          WRONG
                        </small>
                        <span className="fs-5 fw-bold font-monospace text-danger">{result.incorrectAnswers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 bg-light rounded-4 border d-flex align-items-center gap-3">
                      <div
                        className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center fw-bold text-primary"
                        style={{ width: "42px", height: "42px", flexShrink: 0 }}
                      >
                        ⚡
                      </div>
                      <div>
                        <small className="text-muted d-block fw-semibold" style={{ fontSize: "11px" }}>
                          PRACTICE
                        </small>
                        <span className="fw-bold text-primary text-capitalize" style={{ fontSize: "13px" }}>
                          {result.operation.split(",").join(" + ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 bg-light rounded-4 border d-flex align-items-center gap-3">
                      <div
                        className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center fw-bold text-warning"
                        style={{ width: "42px", height: "42px", flexShrink: 0 }}
                      >
                        ⏱
                      </div>
                      <div>
                        <small className="text-muted d-block fw-semibold" style={{ fontSize: "11px" }}>
                          TIME TAKEN
                        </small>
                        <span className="fs-5 fw-bold font-monospace text-dark" style={{ fontSize: "14px" }}>
                          {formatTime(result.timeTaken)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button
                    onClick={handlePlayAgain}
                    disabled={playLoading}
                    className="btn btn-primary py-3 fw-bold fs-5 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: "14px" }}
                  >
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ display: playLoading ? "inline-block" : "none" }}></span>
                    {playLoading ? "Generating..." : "Play Again"}
                  </button>

                  <button
                    onClick={() => router.push("/")}
                    className="btn btn-outline-secondary py-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: "14px" }}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
