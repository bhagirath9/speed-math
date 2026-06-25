import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Result from "@/models/Result";

/**
 * POST /speed-math/api/save-result
 * Persists the final summary of a completed practice session to MongoDB.
 * Records accuracy, count of correct/incorrect answers, and total duration.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      operation,
      difficulty,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage,
      timeTaken,
    } = body;

    // Ensure all required fields exist in the result payload
    if (
      !userId ||
      !operation ||
      !difficulty ||
      totalQuestions === undefined ||
      correctAnswers === undefined ||
      incorrectAnswers === undefined ||
      accuracyPercentage === undefined ||
      timeTaken === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create a new Result document in MongoDB
    const result = await Result.create({
      userId,
      operation,
      difficulty,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage,
      timeTaken,
    });

    return NextResponse.json(
      { message: "Result saved successfully", resultId: result._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Save result error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save result" },
      { status: 500 }
    );
  }
}

