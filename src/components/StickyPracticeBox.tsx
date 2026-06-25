"use client";

import { useState } from "react";
import {
  FaPlusCircle,
  FaMinusCircle,
  FaDivide,
  FaLock,
} from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useModals } from "./ModalContext";

interface Operation {
  id: string;
  label: string;
}

interface StickyPracticeBoxProps {
  mobile?: boolean;
}

/**
 * StickyPracticeBox lets users select mathematical operations (addition, subtraction, multiplication, division)
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

  // Track selection state arrays and difficulty configuration
  const [selectedOperations, setSelectedOperations] =
    useState<string[]>(["addition"]);

  const [difficulty, setDifficulty] =
    useState("easy");
    
  const [startLoading, setStartLoading] = useState(false);

  // Helper check: lock multiplication and division for non-premium users
  const isOperationLocked = (opId: string) => {
    if (opId === "multiplication" || opId === "division") {
      return !isPurchased;
    }
    return false;
  };

  // Helper check: lock medium and hard difficulty configurations for non-premium users
  const isDifficultyLocked = (diff: string) => {
    if (diff === "medium" || diff === "hard") {
      return !isPurchased;
    }
    return false;
  };

  const operations: Operation[] = [
    {
      id: "addition",
      label: "Addition",
    },
    {
      id: "subtraction",
      label: "Subtraction",
    },
    {
      id: "multiplication",
      label: "Multiplication",
    },
    {
      id: "division",
      label: "Division",
    },
  ];

  // Select or deselect a single mathematical operation; checks authorization locks first
  const toggleOperation = (
    operationId: string
  ) => {
    if (isOperationLocked(operationId)) {
      if (!session) {
        openLogin();
      } else {
        openPremium();
      }
      return;
    }
    if (
      selectedOperations.includes(
        operationId
      )
    ) {
      setSelectedOperations(
        selectedOperations.filter(
          (item) =>
            item !== operationId
        )
      );
    } else {
      setSelectedOperations([
        ...selectedOperations,
        operationId,
      ]);
    }
  };

  // Handles select-all action (only selects free operations if user is not upgraded)
  const handleSelectAll = () => {
    if (!isPurchased) {
      const unlockedOps = ["addition", "subtraction"];
      const allUnlockedSelected = unlockedOps.every(op => selectedOperations.includes(op));
      if (allUnlockedSelected) {
        setSelectedOperations([]);
      } else {
        setSelectedOperations(unlockedOps);
      }
      return;
    }

    if (
      selectedOperations.length ===
      operations.length
    ) {
      setSelectedOperations([]);
    } else {
      setSelectedOperations(
        operations.map(
          (item) => item.id
        )
      );
    }
  };

  // Handles updating active difficulty config state; enforces upgrade gates
  const handleDifficultyClick = (diff: string) => {
    if (isDifficultyLocked(diff)) {
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

    if (selectedOperations.length === 0) {
      alert("Please select at least one operation to practice.");
      return;
    }

    setStartLoading(true);

    try {
      const res = await fetch("/speed-math/api/start-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session.user as any).id,
          operation: selectedOperations.join(","),
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
          operation: selectedOperations.join(","),
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

  const getIcon = (
    operation: string
  ) => {
    switch (operation) {
      case "addition":
        return (
          <FaPlusCircle
            size={22}
            color="#1AB394"
          />
        );

      case "subtraction":
        return (
          <FaMinusCircle
            size={22}
            color="#E51C01"
          />
        );

      case "multiplication":
        return (
          <RxCross2
            size={22}
            color="#F59E0B"
          />
        );

      case "division":
        return (
          <FaDivide
            size={22}
            color="#0288D1"
          />
        );

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
            top: "90px",
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
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        {/* Header */}

        <div
          style={{
            background:
              "linear-gradient(90deg,#0B6CBF,#0C3B55)",
            height: "78px",
            display: "flex",
            alignItems: "center",
            padding: "0 30px",
          }}
        >
          <span
            style={{
              fontSize: "35px",
              marginRight: "12px",
            }}
          >
            ⚡
          </span>

          <h2
            style={{
              color: "#fff",
              fontSize: "24px",
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
          {/* Operations */}

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h5
                style={{
                  fontWeight: 700,
                  marginBottom: 0,
                }}
              >
                Select Operations
              </h5>

              <button
                className="btn btn-link p-0 text-decoration-none"
                onClick={
                  handleSelectAll
                }
              >
                {selectedOperations.length ===
                  operations.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <small
              className="text-muted"
            >
              You can select multiple
              operations
            </small>

            <div className="row g-2 mt-2">

              {operations.map(
                (operation) => {
                  const selected =
                    selectedOperations.includes(
                      operation.id
                    );

                  return (
                    <div
                      className="col-6"
                      key={
                        operation.id
                      }
                    >
                      <div
                        onClick={() =>
                          toggleOperation(
                            operation.id
                          )
                        }
                        style={{
                          height:
                            "59px",
                          cursor:
                            "pointer",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                          padding:
                            "0 12px",
                          borderRadius:
                            "5px",
                          background:
                            selected
                              ? "#EAF4FF"
                              : "#fff",
                          border:
                            selected
                              ? "1px solid #0B6CBF"
                              : "1px solid #ddd",
                        }}
                      >
                        {getIcon(
                          operation.id
                        )}

                        <span
                          style={{
                            fontSize:
                              "14px",
                            fontWeight:
                              600,
                            color:
                              selected
                                ? "#0B6CBF"
                                : "#111827",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          {
                            operation.label
                          }
                          {isOperationLocked(operation.id) && (
                            <FaLock size={12} className="text-muted" />
                          )}
                        </span>

                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
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

          <div className="mb-4">
            <h5
              style={{
                fontWeight: 700,
                marginBottom:
                  "15px",
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
                  onClick={() =>
                    handleDifficultyClick(
                      item
                    )
                  }
                  className={`btn rounded-pill d-flex align-items-center gap-1 ${difficulty ===
                    item
                    ? "btn-primary"
                    : "btn-outline-secondary"
                    }`}
                >
                  {item
                    .charAt(0)
                    .toUpperCase() +
                    item.slice(1)}
                  {isDifficultyLocked(item) && (
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
              height: "59px",
              fontSize: "18px",
              fontWeight: 600,
              borderRadius: "12px",
            }}
          >
            {startLoading ? "Starting..." : "Let's Get Started"}
          </button>

          {/* Leaderboard */}

          <div className="text-center mt-4">
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