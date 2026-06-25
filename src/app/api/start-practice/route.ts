import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Question from "@/models/Question";
import QuestionAttempt from "@/models/QuestionAttempt";
import mongoose from "mongoose";

/**
 * Helper function to generate a math question programmatically based on the selected math operation
 * and difficulty level. Ensures division yields clean integer quotients and subtraction yields positive results.
 */
function generateQuestion(op: string, diff: string) {
  let operand1 = 0;
  let operand2 = 0;
  let operator = "";
  let answer = 0;

  if (op === "addition") {
    operator = "+";
    if (diff === "easy") {
      operand1 = Math.floor(Math.random() * 90) + 10; // 10 to 99
      operand2 = Math.floor(Math.random() * 90) + 10; // 10 to 99
    } else if (diff === "medium") {
      operand1 = Math.floor(Math.random() * 900) + 100; // 100 to 999
      operand2 = Math.floor(Math.random() * 900) + 100; // 100 to 999
    } else {
      operand1 = Math.floor(Math.random() * 9000) + 1000; // 1000 to 9999
      operand2 = Math.floor(Math.random() * 9000) + 1000; // 1000 to 9999
    }
    answer = operand1 + operand2;
  } else if (op === "subtraction") {
    operator = "-";
    if (diff === "easy") {
      const num1 = Math.floor(Math.random() * 90) + 10;
      const num2 = Math.floor(Math.random() * 90) + 10;
      operand1 = Math.max(num1, num2);
      operand2 = Math.min(num1, num2);
    } else if (diff === "medium") {
      const num1 = Math.floor(Math.random() * 900) + 100;
      const num2 = Math.floor(Math.random() * 900) + 100;
      operand1 = Math.max(num1, num2);
      operand2 = Math.min(num1, num2);
    } else {
      const num1 = Math.floor(Math.random() * 9000) + 1000;
      const num2 = Math.floor(Math.random() * 9000) + 1000;
      operand1 = Math.max(num1, num2);
      operand2 = Math.min(num1, num2);
    }
    answer = operand1 - operand2;
  } else if (op === "multiplication") {
    operator = "x";
    if (diff === "easy") {
      operand1 = Math.floor(Math.random() * 11) + 2; // 2 to 12
      operand2 = Math.floor(Math.random() * 11) + 2; // 2 to 12
    } else if (diff === "medium") {
      operand1 = Math.floor(Math.random() * 90) + 10; // 10 to 99
      operand2 = Math.floor(Math.random() * 8) + 2;   // 2 to 9
    } else {
      operand1 = Math.floor(Math.random() * 900) + 100; // 100 to 999
      operand2 = Math.floor(Math.random() * 90) + 10;   // 10 to 99
    }
    answer = operand1 * operand2;
  } else if (op === "division") {
    operator = "/";
    // For division, we generate the divisor and answer first to guarantee clean integer divisions
    if (diff === "easy") {
      const divisor = Math.floor(Math.random() * 11) + 2; // 2 to 12
      const result = Math.floor(Math.random() * 11) + 2;  // 2 to 12
      operand1 = divisor * result;
      operand2 = divisor;
      answer = result;
    } else if (diff === "medium") {
      const divisor = Math.floor(Math.random() * 19) + 2; // 2 to 20
      const result = Math.floor(Math.random() * 41) + 10; // 10 to 50
      operand1 = divisor * result;
      operand2 = divisor;
      answer = result;
    } else {
      const divisor = Math.floor(Math.random() * 41) + 10; // 10 to 50
      const result = Math.floor(Math.random() * 131) + 20; // 20 to 150
      operand1 = divisor * result;
      operand2 = divisor;
      answer = result;
    }
  }

  return {
    operand1,
    operand2,
    operator,
    answer,
    operation: op,
    difficulty: diff,
  };
}

/**
 * POST /speed-math/api/start-practice
 * Initializes a new math practice session. Enforces premium paywall rules, filters out 
 * already answered questions for the user, checks database supply, and pulls a random sample of questions.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, operation, difficulty } = body;

    // Validate incoming parameters
    if (!userId || !operation || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPremium = user.isSpeedMathPurchased;
    const ops = operation.split(",");

    // Lock multiplication/division for free tier users
    for (const op of ops) {
      if (!isPremium && (op === "multiplication" || op === "division")) {
        return NextResponse.json(
          { error: "Multiplication and Division are locked for non-premium users." },
          { status: 403 }
        );
      }
    }

    // Lock medium/hard difficulties for free tier users
    if (!isPremium && (difficulty === "medium" || difficulty === "hard")) {
      return NextResponse.json(
        { error: "Medium and Hard difficulties are locked for non-premium users." },
        { status: 403 }
      );
    }

    // Fetch distinct IDs of previously solved (correctly answered) questions to prevent duplicates
    const attempts = await QuestionAttempt.find({ userId, isCorrect: true }).distinct("questionId");
    const attemptedIds = attempts.map(id => new mongoose.Types.ObjectId(id));

    // Ensure database contains at least 10 unattempted questions of each selected operation;
    // auto-generate and insert new ones if database supply falls short.
    for (const op of ops) {
      const count = await Question.countDocuments({
        operation: op,
        difficulty,
        _id: { $nin: attemptedIds },
      });

      if (count < 10) {
        const newQuestions = [];
        for (let i = 0; i < 20; i++) {
          newQuestions.push(generateQuestion(op, difficulty));
        }
        await Question.insertMany(newQuestions);
      }
    }

    // Retrieve random sampling of 10 unattempted questions via Mongo Aggregation
    const questions = await Question.aggregate([
      {
        $match: {
          operation: { $in: ops },
          difficulty,
          _id: { $nin: attemptedIds },
        },
      },
      { $sample: { size: 10 } },
    ]);

    let selectedQuestions = questions;
    // Fall back to a standard MongoDB find limit check if aggregation sample returns less than 10
    if (selectedQuestions.length < 10) {
      selectedQuestions = await Question.find({
        operation: { $in: ops },
        difficulty,
        _id: { $nin: attemptedIds },
      }).limit(10);
    }

    const sessionId = new mongoose.Types.ObjectId().toString();

    const formattedQuestions = selectedQuestions.map((q: any) => ({
      id: q._id.toString(),
      operand1: q.operand1,
      operand2: q.operand2,
      operator: q.operator,
      answer: q.answer,
      operation: q.operation,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      sessionId,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error("Start practice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start practice session" },
      { status: 500 }
    );
  }
}
