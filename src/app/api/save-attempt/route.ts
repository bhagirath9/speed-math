import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import QuestionAttempt from "@/models/QuestionAttempt";

/**
 * POST /speed-math/api/save-attempt
 * Logs an individual question attempt in real-time during a practice session.
 * Used for tracking user responses, correctness, and speed breakdowns.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, sessionId, questionId, operation, difficulty, isCorrect } = body;

    // Validate that all required properties exist in the request body
    if (!userId || !sessionId || !questionId || !operation || !difficulty || isCorrect === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Persist user's single question attempt log
    const attempt = await QuestionAttempt.create({
      userId,
      sessionId,
      questionId,
      operation,
      difficulty,
      isCorrect,
    });

    return NextResponse.json(
      { message: "Attempt saved successfully", attemptId: attempt._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Save attempt error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save attempt" },
      { status: 500 }
    );
  }
}

