import mongoose, { Schema, model, models } from "mongoose";

// Schema for pre-generated mathematics questions
const QuestionSchema = new Schema(
  {
    category: {
      type: String,
      default: "Math",
      index: true,
    },
    topic: {
      type: String,
      index: true,
    },
    difficulty: {
      type: String, // e.g. "easy", "medium", "hard"
      required: true,
      index: true, // Indexed to support fast filtering in session generation queries
    },
    question: {
      type: String,
    },
    answer: {
      type: Number,
      required: true,
    },
    operand1: {
      type: Number,
    },
    operand2: {
      type: Number,
    },
    operator: {
      type: String,
    },
    operation: {
      type: String, // e.g. "addition", "subtraction", "multiplication", "division"
      index: true, // Indexed to support fast filtering in session generation queries
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// Prevent compiled Mongoose model compilation errors during Hot Module Reloading in development
const Question = models.Question || model("Question", QuestionSchema);

export default Question;

