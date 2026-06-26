import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Question from "@/models/Question";
import QuestionAttempt from "@/models/QuestionAttempt";
import mongoose from "mongoose";
import { isTopicLocked, isDifficultyLocked } from "@/lib/categoriesConfig";

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
 * Initializes a new practice session (Math or GK). Enforces premium paywall rules, filters out 
 * already answered questions for the user, checks database supply, and pulls a random sample of questions.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, category, selectedTopics, difficulty, operation } = body;

    const activeCategory = category || "Math";
    const topicsStr = selectedTopics || operation;

    // Validate incoming parameters
    if (!userId || !topicsStr || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPremium = user.isSpeedMathPurchased || false;
    const topics = topicsStr.split(",");

    // Lock check for each selected topic/operation
    for (const topic of topics) {
      if (isTopicLocked(activeCategory, topic, isPremium)) {
        return NextResponse.json(
          { error: `${topic} is locked for non-premium users.` },
          { status: 403 }
        );
      }
    }

    // Lock check for active difficulty
    if (isDifficultyLocked(difficulty, isPremium)) {
      return NextResponse.json(
        { error: `Difficulty ${difficulty} is locked for non-premium users.` },
        { status: 403 }
      );
    }

    // Fetch distinct IDs of previously solved (correctly answered) questions to prevent duplicates
    const attempts = await QuestionAttempt.find({ userId, isCorrect: true }).distinct("questionId");
    const attemptedIds = attempts.map(id => new mongoose.Types.ObjectId(id));

    // Ensure database contains at least 10 unattempted questions of each selected topic;
    // auto-generate (Math) or seed (GK) new ones if database supply falls short.
    if (activeCategory === "Math") {
      for (const op of topics) {
        const count = await Question.countDocuments({
          $or: [
            { category: "Math", topic: op, difficulty, _id: { $nin: attemptedIds } },
            { category: { $exists: false }, operation: op, difficulty, _id: { $nin: attemptedIds } }
          ]
        });

        if (count < 10) {
          const newQuestions = [];
          for (let i = 0; i < 20; i++) {
            const pq = generateQuestion(op, difficulty);
            newQuestions.push({
              category: "Math",
              topic: op,
              difficulty,
              operand1: pq.operand1,
              operand2: pq.operand2,
              operator: pq.operator,
              answer: pq.answer,
              operation: op
            });
          }
          await Question.insertMany(newQuestions);
        }
      }
    } else if (activeCategory === "GK") {
      const { GK_QUESTIONS_DATA } = require("@/lib/gkQuestionsList");
      for (const topic of topics) {
        const count = await Question.countDocuments({
          category: "GK",
          topic,
          difficulty,
          _id: { $nin: attemptedIds }
        });

        if (count < 10) {
          // Find matching questions from our preset list
          const matchingPreset = GK_QUESTIONS_DATA.filter(
            (q: any) => q.topic === topic && q.difficulty === difficulty
          );

          // Get already existing questions of this type in DB to avoid inserting exact duplicates
          const existingInDb = await Question.find({
            category: "GK",
            topic,
            difficulty
          }).select("question");
          const existingTexts = new Set(existingInDb.map((q: any) => q.question));

          const newQuestionsToInsert = [];
          for (const preset of matchingPreset) {
            if (!existingTexts.has(preset.question)) {
              newQuestionsToInsert.push({
                category: "GK",
                topic,
                difficulty,
                question: preset.question,
                answer: preset.answer
              });
            }
          }

          if (newQuestionsToInsert.length > 0) {
            await Question.insertMany(newQuestionsToInsert);
          }
        }
      }
    }

    // Retrieve random sampling of 10 unattempted questions via Mongo Aggregation
    let matchQuery: any = {};
    if (activeCategory === "Math") {
      matchQuery = {
        $or: [
          { category: "Math", topic: { $in: topics } },
          { category: { $exists: false }, operation: { $in: topics } }
        ],
        difficulty,
        _id: { $nin: attemptedIds }
      };
    } else {
      matchQuery = {
        category: activeCategory,
        topic: { $in: topics },
        difficulty,
        _id: { $nin: attemptedIds }
      };
    }

    let questions = await Question.aggregate([
      { $match: matchQuery },
      { $sample: { size: 10 } }
    ]);

    // Fall back to picking already attempted questions if we don't have enough unseen questions left
    if (questions.length < 10) {
      const remainingCount = 10 - questions.length;
      let fallbackMatchQuery: any = {};
      if (activeCategory === "Math") {
        fallbackMatchQuery = {
          $or: [
            { category: "Math", topic: { $in: topics } },
            { category: { $exists: false }, operation: { $in: topics } }
          ],
          difficulty
        };
      } else {
        fallbackMatchQuery = {
          category: activeCategory,
          topic: { $in: topics },
          difficulty
        };
      }

      // Exclude already selected questions in this run
      const pickedIds = questions.map((q: any) => q._id);
      fallbackMatchQuery._id = { $nin: pickedIds };

      const repeatedQuestions = await Question.aggregate([
        { $match: fallbackMatchQuery },
        { $sample: { size: remainingCount } }
      ]);

      questions = [...questions, ...repeatedQuestions];
    }

    const sessionId = new mongoose.Types.ObjectId().toString();

    const formattedQuestions = questions.map((q: any) => ({
      id: q._id.toString(),
      operand1: q.operand1,
      operand2: q.operand2,
      operator: q.operator,
      answer: q.answer,
      operation: q.operation || q.topic,
      difficulty: q.difficulty,
      category: q.category || "Math",
      topic: q.topic || q.operation,
      question: q.question,
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
