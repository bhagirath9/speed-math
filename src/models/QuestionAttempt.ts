import mongoose, { Schema, model, models } from "mongoose";

// Schema for tracking individual math problem attempts within a practice session
const QuestionAttemptSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Indexed to support fast statistics/reports queries by user
    },
    sessionId: {
      type: String,
      required: true,
      index: true, // Indexed to support fast session retrieval and grouping queries
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    category: {
      type: String,
      index: true,
    },
    topic: {
      type: String,
      index: true,
    },
    operation: {
      type: String,
    },
    difficulty: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// Prevent compiled Mongoose model compilation errors during Hot Module Reloading in development
const QuestionAttempt = models.QuestionAttempt || model("QuestionAttempt", QuestionAttemptSchema);

export default QuestionAttempt;

