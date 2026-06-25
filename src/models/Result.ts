import mongoose, { Schema, model, models } from "mongoose";

// Schema for storing the final aggregated summaries of completed practice sessions
const ResultSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Indexed to query stats cards / performance graphs for a user quickly
    },
    operation: {
      type: String, // addition, subtraction, multiplication, division, or mixed operations
      required: true,
    },
    difficulty: {
      type: String, // easy, medium, hard
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 10,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    incorrectAnswers: {
      type: Number,
      required: true,
    },
    accuracyPercentage: {
      type: Number,
      required: true,
    },
    timeTaken: {
      type: Number, // Total practice duration in seconds
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// Prevent compiled Mongoose model compilation errors during Hot Module Reloading in development
const Result = models.Result || model("Result", ResultSchema);

export default Result;

