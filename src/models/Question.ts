import mongoose, { Schema, model, models } from "mongoose";

// Schema for pre-generated mathematics questions
const QuestionSchema = new Schema(
  {
    operand1: {
      type: Number,
      required: true,
    },
    operand2: {
      type: Number,
      required: true,
    },
    operator: {
      type: String,
      required: true,
    },
    answer: {
      type: Number,
      required: true,
    },
    operation: {
      type: String, // e.g. "addition", "subtraction", "multiplication", "division"
      required: true,
      index: true, // Indexed to support fast filtering in session generation queries
    },
    difficulty: {
      type: String, // e.g. "easy", "medium", "hard"
      required: true,
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

