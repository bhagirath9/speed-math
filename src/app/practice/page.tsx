"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaClock } from "react-icons/fa";

// Interface representing a single mathematics question in the practice session
interface Question {
  id: string;
  operand1: number;
  operand2: number;
  operator: string;
  answer: number;
  operation: string;
  difficulty: string;
}

// Interface representing the overall metadata and questions list of a practice session
interface SessionData {
  sessionId: string;
  questions: Question[];
  operation: string;
  difficulty: string;
}

/**
 * PracticePage handles the interactive mathematical practice session.
 * Features auto-submission on correct answers, timer tracking, and a layout focus mode.
 */
export default function PracticePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Component state management
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0); // Current active question index
  const [userAnswer, setUserAnswer] = useState(""); // Current text inside the numeric input
  const [isWrong, setIsWrong] = useState(false); // Controls error invalid border styling
  const [isCorrectFeedback, setIsCorrectFeedback] = useState(false); // Controls success border and background styling
  const [isFocusMode, setIsFocusMode] = useState(false); // Toggles full-screen layout mode
  const [showKeypad, setShowKeypad] = useState(false); // Toggles visibility of the numeric keypad
  const [showRestartConfirm, setShowRestartConfirm] = useState(false); // Controls restart confirmation dialog
  const [hasCurrentQuestionBeenWrong, setHasCurrentQuestionBeenWrong] = useState(false); // Tracks if current question was missed
  const [isInputFocused, setIsInputFocused] = useState(false); // Tracks if input field is active
  const [isRestarting, setIsRestarting] = useState(false); // Tracks if session is restarting and fetching new questions

  const [correctCount, setCorrectCount] = useState(0); // Number of correctly answered questions
  const [totalTime, setTotalTime] = useState(0); // Total practice session duration in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null); // Reference to the active timer interval
  const inputRef = useRef<HTMLInputElement>(null); // Reference to auto-focus the answer input field
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce timer for checking answers

  // Redirect to home page if user is not logged in or if practice session does not exist in localStorage
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    const localData = localStorage.getItem("speed_math_practice_session");
    if (!localData) {
      router.push("/");
      return;
    }

    try {
      const parsed: SessionData = JSON.parse(localData);
      if (!parsed.questions || parsed.questions.length === 0) {
        router.push("/");
      } else {
        setSessionData(parsed);
      }
    } catch (e) {
      router.push("/");
    }
  }, [status, router]);

  // Start the session timer interval upon receiving session questions
  useEffect(() => {
    if (!sessionData) return;

    timerRef.current = setInterval(() => {
      setTotalTime((prev) => prev + 1);
    }, 1000);

    // Clean up the timer interval when component unmounts or sessionData changes
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionData]);

  // Keep input focused when switching questions
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIdx, sessionData]);

  // Toggle navbar visibility during focus mode
  useEffect(() => {
    const nav = document.querySelector("nav.navbar");
    if (nav) {
      if (isFocusMode) {
        nav.classList.add("d-none");
      } else {
        nav.classList.remove("d-none");
      }
    }
    return () => {
      if (nav) {
        nav.classList.remove("d-none");
      }
    };
  }, [isFocusMode]);

  // Clean up answer check timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  if (status === "loading" || !sessionData) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const questions = sessionData.questions;
  const currentQuestion = questions[currentIdx];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  /**
   * Performs the answer comparison and triggers appropriate correctness flows.
   */
  const checkAnswer = async (valueToCheck: string) => {
    const trimmedVal = valueToCheck.trim();
    if (!trimmedVal) return;

    const correctAnsStr = currentQuestion.answer.toString();
    if (trimmedVal === correctAnsStr) {
      await handleCorrectAnswer();
    } else {
      await handleWrongAnswer();
    }
  };

  /**
   * Triggers correct answer visual state, logs successful attempts, and proceeds to next question.
   */
  const handleCorrectAnswer = async () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    setIsCorrectFeedback(true);
    setIsWrong(false);

    try {
      await fetch("/speed-math/api/save-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any).id,
          sessionId: sessionData.sessionId,
          questionId: currentQuestion.id,
          operation: currentQuestion.operation,
          difficulty: currentQuestion.difficulty,
          isCorrect: true,
        }),
      });
    } catch (err) {
      console.error("Failed to save attempt:", err);
    }

    // Only increment the first-try correct score if they haven't missed it yet
    const isFirstTryCorrect = !hasCurrentQuestionBeenWrong;
    if (isFirstTryCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    setTimeout(async () => {
      setIsCorrectFeedback(false);
      setUserAnswer("");
      setHasCurrentQuestionBeenWrong(false);

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);

        const finalCorrect = isFirstTryCorrect ? correctCount + 1 : correctCount;
        const accuracy = Math.round((finalCorrect / questions.length) * 100);
        const wrongCount = questions.length - finalCorrect;

        try {
          await fetch("/speed-math/api/save-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: (session?.user as any).id,
              operation: sessionData.operation,
              difficulty: sessionData.difficulty,
              totalQuestions: questions.length,
              correctAnswers: finalCorrect,
              incorrectAnswers: wrongCount,
              accuracyPercentage: accuracy,
              timeTaken: totalTime,
            }),
          });

          localStorage.setItem(
            "speed_math_last_result",
            JSON.stringify({
              operation: sessionData.operation,
              difficulty: sessionData.difficulty,
              correctAnswers: finalCorrect,
              incorrectAnswers: wrongCount,
              accuracyPercentage: accuracy,
              timeTaken: totalTime,
            })
          );

          router.push("/result");
        } catch (err) {
          console.error("Failed to save result:", err);
          alert("Failed to save session result.");
          router.push("/");
        }
      }
    }, 150);
  };

  /**
   * Triggers wrong answer state, sets the input border to red, and records attempt.
   */
  const handleWrongAnswer = async () => {
    setIsWrong(true);
    setIsCorrectFeedback(false);

    if (!hasCurrentQuestionBeenWrong) {
      setHasCurrentQuestionBeenWrong(true);
      try {
        await fetch("/speed-math/api/save-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: (session?.user as any).id,
            sessionId: sessionData.sessionId,
            questionId: currentQuestion.id,
            operation: currentQuestion.operation,
            difficulty: currentQuestion.difficulty,
            isCorrect: false,
          }),
        });
      } catch (err) {
        console.error("Failed to save attempt:", err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCorrectFeedback) return;

    const value = e.target.value;
    setUserAnswer(value);
    setIsWrong(false);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmedVal = value.trim();
    if (!trimmedVal) return;

    const correctAnsStr = currentQuestion.answer.toString();

    // Correct answers match immediately. Incorrect ones check after a 2-second pause.
    if (trimmedVal === correctAnsStr) {
      checkAnswer(trimmedVal);
    } else {
      checkTimeoutRef.current = setTimeout(() => {
        checkAnswer(trimmedVal);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isCorrectFeedback) return;

    if (e.key === "Enter") {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      checkAnswer(userAnswer);
    }
  };

  const kp = (num: number) => {
    if (isCorrectFeedback) return;
    const newVal = userAnswer + num;
    setUserAnswer(newVal);
    setIsWrong(false);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmedVal = newVal.trim();
    const correctAnsStr = currentQuestion.answer.toString();

    if (trimmedVal === correctAnsStr) {
      checkAnswer(trimmedVal);
    } else {
      checkTimeoutRef.current = setTimeout(() => {
        checkAnswer(trimmedVal);
      }, 2000);
    }
  };

  const kpBackspace = () => {
    if (isCorrectFeedback) return;
    const newVal = userAnswer.slice(0, -1);
    setUserAnswer(newVal);
    setIsWrong(false);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmedVal = newVal.trim();
    if (trimmedVal) {
      checkTimeoutRef.current = setTimeout(() => {
        checkAnswer(trimmedVal);
      }, 2000);
    }
  };

  // Toggle visibility of the numeric keypad
  const toggleKeypad = () => {
    setShowKeypad((prev) => !prev);
  };

  // Route to the dashboard page
  const exitQuiz = () => {
    router.push("/");
  };

  // Reset practice state to start the session questions from scratch by fetching new unattempted questions
  const restartQuiz = async () => {
    setIsRestarting(true);
    try {
      const res = await fetch("/speed-math/api/start-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any).id,
          operation: sessionData.operation,
          difficulty: sessionData.difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to restart practice");
      } else {
        const newSessionData = {
          sessionId: data.sessionId,
          questions: data.questions,
          operation: sessionData.operation,
          difficulty: sessionData.difficulty,
        };
        localStorage.setItem("speed_math_practice_session", JSON.stringify(newSessionData));
        setSessionData(newSessionData);
        setCurrentIdx(0);
        setCorrectCount(0);
        setTotalTime(0);
        setUserAnswer("");
        setIsWrong(false);
        setIsCorrectFeedback(false);
        setHasCurrentQuestionBeenWrong(false);
        if (checkTimeoutRef.current) {
          clearTimeout(checkTimeoutRef.current);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start new practice session. Please try again.");
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <div
      id="speedmath-quiz"
      className="container px-4"
      style={
        isFocusMode
          ? {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#fafafa",
            zIndex: 9999,
            overflowY: "auto",
            padding: "24px 16px",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }
          : {
            minHeight: "90vh",
            backgroundColor: "#fafafa",
            padding: "40px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }
      }
    >
      <div
        className="w-100 mx-auto"
        style={{
          width: "100%",
          maxWidth: "700px",
          backgroundColor: "#ffffff",
          border: "1px solid #dedede",
          borderRadius: "10px",
          boxShadow: "0px 4px 16px -1px rgba(0,0,0,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header bar (always visible, navbar hidden dynamically via CSS in focus mode) */}
        <div
          id="quiz-header"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <span
            id="question-number"
            style={{
              fontSize: "14px",
              color: "#4b5563",
              fontWeight: 600,
            }}
          >
            Q: {currentIdx + 1} / {questions.length}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 700,
              fontSize: "16px",
              color: "#0d6efd",
            }}
          >
            <FaClock style={{ marginRight: "4px" }} />
            <span id="timer-display">{formatTime(totalTime)}</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="focus-toggle position-relative"
              style={{
                position: "relative",
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                backgroundColor: isFocusMode ? "#0d6efd" : "#d2d5da",
                border: "none",
                padding: 0,
                transition: "background-color 0.2s ease",
                cursor: "pointer",
              }}
            >
              <span
                className="focus-knob"
                style={{
                  position: "absolute",
                  top: "2px",
                  left: isFocusMode ? "20px" : "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  boxShadow: "0px 2px 4px rgba(39, 39, 39, 0.1)",
                  transition: "left 0.2s ease",
                }}
              />
            </button>
            <span className="fw-medium text-dark d-none d-sm-inline" style={{ fontWeight: 500, fontSize: "14px", color: "#374151" }}>Focus</span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          id="quiz-progress"
          className="px-4 px-md-5 position-relative"
          style={{ paddingLeft: "24px", paddingRight: "24px", marginTop: "-3px", zIndex: 10 }}
        >
          <div
            style={{
              height: "4px",
              width: "100%",
              backgroundColor: "#e5e7eb",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(currentIdx / questions.length) * 100}%`,
                backgroundColor: "#0d6efd",
                transition: "width 0.3s ease-in-out",
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div
          className="py-4 py-lg-5 px-4 text-center"
          style={{
            transition: "all 0.2s ease-in-out",
            backgroundColor: isCorrectFeedback ? "#EAFDF5" : "#ffffff", // Keep card background white on wrong answer
          }}
        >

          <p
            id="question-text"
            className="text-center mb-4 mb-lg-5 font-monospace"
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1,
              letterSpacing: "1px",
            }}
          >
            {currentQuestion.operand1} {currentQuestion.operator === "/" ? "÷" : currentQuestion.operator} {currentQuestion.operand2}
          </p>
          <div className="mx-auto w-100" style={{ maxWidth: "551px" }}>
            <input
              ref={inputRef}
              id="answer-input"
              type="text"
              pattern="[0-9\-]*"
              inputMode="numeric"
              autoComplete="off"
              className="d-block w-100 text-center font-monospace fw-bold py-3 fs-2"
              style={{
                borderRadius: "10px",
                backgroundColor: "transparent",
                border: isWrong
                  ? "2px solid #EF4444"
                  : isCorrectFeedback
                    ? "2px solid #10B981"
                    : isInputFocused
                      ? "2px solid #3b82f6"
                      : "1px solid #dedede",
                boxShadow: isWrong
                  ? "0 0 0 4px rgba(239, 68, 68, 0.1)"
                  : isCorrectFeedback
                    ? "0 0 0 4px rgba(16, 185, 129, 0.1)"
                    : isInputFocused
                      ? "0 0 0 4px rgba(59, 130, 246, 0.1)"
                      : "none",
                outline: "none",
                transition: "all 0.2s ease-in-out",
              }}
              value={userAnswer}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              disabled={isCorrectFeedback}
              placeholder="?"
            />
          </div>

          {/* Numeric Keypad (centered directly under the input box) */}
          <div
            id="numeric-keypad"
            style={{
              display: showKeypad ? "flex" : "none",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "24px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 60px)",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => kp(num)}
                  className="kp-btn"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => kp(0)}
                className="kp-btn"
              >
                0
              </button>
              <button
                type="button"
                onClick={kpBackspace}
                className="kp-btn d-flex align-items-center justify-content-center"
                aria-label="backspace"
              >
                <svg
                  width="18"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Keypad toggle link button with added space below */}
          <div className="text-center" style={{ marginTop: "16px", marginBottom: "24px" }}>
            <button
              id="keypad-toggle"
              type="button"
              onClick={toggleKeypad}
              style={{
                border: "none",
                background: "none",
                color: "#6b7280",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "13px",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              {showKeypad ? "Hide keypad" : "Show keypad"}
            </button>
          </div>
        </div>
      </div>

      <div
        id="quiz-footer"
        className="mt-3 mt-lg-4 mx-auto"
        style={{
          width: "100%",
          maxWidth: "700px",
          display: "flex",
          justifyContent: "space-between",
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        <button
          type="button"
          onClick={exitQuiz}
          style={{
            border: "none",
            background: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "14px",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
        >
          Exit Quiz
        </button>
        <button
          type="button"
          onClick={() => setShowRestartConfirm(true)}
          style={{
            border: "none",
            background: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "14px",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
        >
          Restart Quiz
        </button>
      </div>

      {/* Custom Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "400px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "8px",
              }}
            >
              Restart quiz?
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                lineHeight: "1.5",
                marginBottom: "24px",
                whiteSpace: "pre-line",
              }}
            >
              Your current progress will be lost.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                disabled={isRestarting}
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: isRestarting ? "not-allowed" : "pointer",
                  opacity: isRestarting ? 0.7 : 1,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isRestarting) e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isRestarting) e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestarting}
                onClick={async () => {
                  await restartQuiz();
                  setShowRestartConfirm(false);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: isRestarting ? "not-allowed" : "pointer",
                  opacity: isRestarting ? 0.7 : 1,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isRestarting) e.currentTarget.style.backgroundColor = "#b91c1c";
                }}
                onMouseLeave={(e) => {
                  if (!isRestarting) e.currentTarget.style.backgroundColor = "#dc2626";
                }}
              >
                {isRestarting ? "Restarting..." : "Restart"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        #answer-input {
          font-size: 48px;
          height: 108px;
        }
        @media (min-width: 992px) {
          #answer-input {
            font-size: 80px;
            height: 140px;
          }
        }
        .kp-btn {
          width: 60px;
          height: 60px;
          border: 1px solid #dedede;
          border-radius: 8px;
          background-color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
          cursor: pointer;
        }
        .kp-btn:active {
          background-color: #f3f4f6;
        }
        .kp-btn:hover {
          border-color: #0d6efd;
        }
      `}</style>
    </div>
  );
}

