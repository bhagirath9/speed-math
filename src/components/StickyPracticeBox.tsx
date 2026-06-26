"use client";

import { useState } from "react";
import {
  FaPlusCircle,
  FaMinusCircle,
  FaDivide,
  FaLock,
  FaBook,
  FaPalette,
  FaFortAwesome,
  FaMusic
} from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useModals } from "./ModalContext";
import { CATEGORIES_CONFIG, isTopicLocked, isDifficultyLocked } from "@/lib/categoriesConfig";

interface StickyPracticeBoxProps {
  mobile?: boolean;
}

/**
 * StickyPracticeBox lets users select categories (Math, GK), topics/operations,
 * and difficulties (easy, medium, hard) to configure their practice session.
 * Enforces locks on premium elements and launches practice session initialization API calls.
 */
const StickyPracticeBox = ({
  mobile = false,
}: StickyPracticeBoxProps) => {
  const { data: session } = useSession();
  const { openLogin, openPremium } = useModals();
  const router = useRouter();

  // Read purchase upgrade status from current session context
  const isPurchased = (session?.user as any)?.isSpeedMathPurchased || false;

  // Track category, topics, and difficulty
  const [category, setCategory] = useState<string>("Math");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["addition"]);
  const [difficulty, setDifficulty] = useState("easy");
  const [startLoading, setStartLoading] = useState(false);

  // Helper check: lock topic/operation based on category config
  const isOperationLocked = (opId: string) => {
    return isTopicLocked(category, opId, isPurchased);
  };

  // Helper check: lock medium and hard difficulty configurations for non-premium users
  const isDiffLocked = (diff: string) => {
    return isDifficultyLocked(diff, isPurchased);
  };

  const activeCategoryConfig = CATEGORIES_CONFIG.find(cat => cat.id === category) || CATEGORIES_CONFIG[0];
  const topics = activeCategoryConfig.topics;

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const catConfig = CATEGORIES_CONFIG.find(c => c.id === catId);
    if (catConfig && catConfig.topics.length > 0) {
      // Free default: select first topic by default
      setSelectedTopics([catConfig.topics[0].id]);
    } else {
      setSelectedTopics([]);
    }
  };

  // Select or deselect a single topic; checks authorization locks first
  const toggleOperation = (operationId: string) => {
    if (isOperationLocked(operationId)) {
      if (!session) {
        openLogin();
      } else {
        openPremium();
      }
      return;
    }
    if (selectedTopics.includes(operationId)) {
      setSelectedTopics(selectedTopics.filter((item) => item !== operationId));
    } else {
      setSelectedTopics([...selectedTopics, operationId]);
    }
  };

  // Handles select-all action (only selects free topics if user is not upgraded)
  const handleSelectAll = () => {
    if (!isPurchased) {
      const freeTopics = topics
        .filter((t) => !isTopicLocked(category, t.id, isPurchased))
        .map((t) => t.id);

      const allFreeSelected = freeTopics.every(tId => selectedTopics.includes(tId));
      if (allFreeSelected) {
        setSelectedTopics([]);
      } else {
        setSelectedTopics(freeTopics);
      }
      return;
    }

    if (selectedTopics.length === topics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(topics.map((item) => item.id));
    }
  };

  // Handles updating active difficulty config state; enforces upgrade gates
  const handleDifficultyClick = (diff: string) => {
    if (isDiffLocked(diff)) {
      if (!session) {
        openLogin();
      } else {
        openPremium();
      }
      return;
    }
    setDifficulty(diff);
  };

  // Calls api backend to populate question set, saves metadata to localStorage, and routes to /practice
  const handleStartPractice = async () => {
    if (!session) {
      openLogin();
      return;
    }

    if (selectedTopics.length === 0) {
      alert(`Please select at least one ${category === "Math" ? "operation" : "topic"} to practice.`);
      return;
    }

    setStartLoading(true);

    try {
      const res = await fetch("/api/start-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session.user as any).id,
          category,
          selectedTopics: selectedTopics.join(","),
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start practice");
      } else {
        localStorage.setItem("speed_math_practice_session", JSON.stringify({
          sessionId: data.sessionId,
          questions: data.questions,
          category,
          operation: selectedTopics.join(","), // Saved as operation for compatibility
          difficulty,
        }));
        router.push("/practice");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setStartLoading(false);
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case "addition":
        return <FaPlusCircle size={22} color="#1AB394" />;
      case "subtraction":
        return <FaMinusCircle size={22} color="#E51C01" />;
      case "multiplication":
        return <RxCross2 size={22} color="#F59E0B" />;
      case "division":
        return <FaDivide size={22} color="#0288D1" />;
      case "Indian History":
        return <FaBook size={22} color="#8B4513" />;
      case "Indian Culture":
        return <FaPalette size={22} color="#FF69B4" />;
      case "Rajasthan History":
        return <FaFortAwesome size={22} color="#D2691E" />;
      case "Rajasthan Culture":
        return <FaMusic size={22} color="#FFD700" />;
      default:
        return null;
    }
  };

  return (
    <div
      style={
        mobile
          ? {
            width: "100%",
            marginTop: "20px",
            marginBottom: "20px",
          }
          : {
            position: "fixed",
            right: "50px",
            top: "65px",
            width: "430px",
            zIndex: 1000,
          }
      }
    >
      <div
        className="shadow"
        style={{
          background:
            "linear-gradient(to bottom,#f0faff,#ffffff)",
          borderRadius: "25px",
          overflow: "hidden",
        }}
      >
        {/* Header */}

        <div
          style={{
            background:
              "linear-gradient(90deg,#0B6CBF,#0C3B55)",
            height: "60px",
            display: "flex",
            alignItems: "center",
            padding: "0 30px",
          }}
        >
          <span
            style={{
              fontSize: "25px",
              marginRight: "12px",
            }}
          >
            ⚡
          </span>

          <h2
            style={{
              color: "#fff",
              fontSize: "20px",
              fontWeight: 700,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            Start Practicing Now...
          </h2>
        </div>

        {/* Body */}

        <div
          style={{
            padding: "24px 32px",
          }}
        >
          {/* Categories Selector */}
          <div>
            <h5 style={{ fontWeight: 700, marginBottom: "5px" }}>Category</h5>
            <div className="d-flex gap-2">
              {CATEGORIES_CONFIG.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`btn rounded-pill px-4 ${isActive ? "btn-primary" : "btn-outline-secondary"
                      }`}
                    style={{
                      fontWeight: 600,
                      fontSize: "12px",
                      transition: "all 0.2s",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ margin: "10px 0", border: "0", borderTop: "1px solid #ddd" }} />

          {/* Operations / Topics Grid */}

          <div className="mb-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h5
                style={{
                  fontWeight: 700,
                  marginBottom: 0,
                }}
              >
                {category === "Math" ? "Select Operations" : "Select Topics"}
              </h5>

              <button
                className="btn btn-link p-0 text-decoration-none"
                onClick={
                  handleSelectAll
                }
              >
                {selectedTopics.length === topics.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <small
              className="text-muted"
            >
              You can select multiple {category === "Math" ? "operations" : "topics"}
            </small>

            <div className="row g-2 mt-2">

              {topics.map(
                (topic) => {
                  const selected = selectedTopics.includes(topic.id);

                  return (
                    <div
                      className="col-6"
                      key={topic.id}
                    >
                      <div
                        onClick={() => toggleOperation(topic.id)}
                        style={{
                          height: "45px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "0 10px",
                          borderRadius: "5px",
                          background: selected ? "#EAF4FF" : "#fff",
                          border: selected ? "1px solid #0B6CBF" : "1px solid #ddd",
                        }}
                      >
                        {getIcon(topic.id)}

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: selected ? "#0B6CBF" : "#111827",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          {topic.label}
                          {isOperationLocked(topic.id) && (
                            <FaLock size={12} className="text-muted" />
                          )}
                        </span>

                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="ms-auto"
                        />
                      </div>
                    </div>
                  );
                }
              )}

            </div>
          </div>

          {/* Difficulty */}

          <div className="mb-3">
            <h5
              style={{
                fontWeight: 700,
                marginBottom:
                  "10px",
              }}
            >
              Select Difficulty
            </h5>

            <div className="d-flex gap-2">

              {[
                "easy",
                "medium",
                "hard",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => handleDifficultyClick(item)}
                  className={`btn rounded-pill d-flex align-items-center gap-1 ${difficulty === item ? "btn-primary" : "btn-outline-secondary"
                    }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                  {isDiffLocked(item) && (
                    <FaLock size={10} className={difficulty === item ? "text-white" : "text-muted"} />
                  )}
                </button>
              ))}

            </div>
          </div>

          {/* CTA */}

          <button
            className="btn btn-primary w-100"
            onClick={handleStartPractice}
            disabled={startLoading}
            style={{
              height: "40px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "12px",
            }}
          >
            {startLoading ? "Starting..." : "Let's Get Started"}
          </button>

          {/* Leaderboard */}

          <div className="text-center mt-2">
            <a
              href="/speedmath/leaderboard"
              style={{
                textDecoration:
                  "none",
                fontWeight: 500,
              }}
            >
              View Leaderboard
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StickyPracticeBox;