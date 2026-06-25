import mongoose from "mongoose";

import Question from "../src/models/Question";

const MONGODB_URI =
  process.env.MONGODB_URI!;

async function seedQuestions() {

  await mongoose.connect(
    MONGODB_URI
  );

  console.log(
    "Mongo Connected"
  );

  const questions = [];

  // EASY ADDITION

  for (
    let i = 0;
    i < 1000;
    i++
  ) {

    const a =
      Math.floor(
        Math.random() * 50
      ) + 1;

    const b =
      Math.floor(
        Math.random() * 50
      ) + 1;

    questions.push({
      question:
        `${a} + ${b}`,

      answer:
        a + b,

      operation:
        "addition",

      difficulty:
        "easy",
    });
  }

  // EASY SUBTRACTION

  for (
    let i = 0;
    i < 1000;
    i++
  ) {

    const a =
      Math.floor(
        Math.random() * 100
      ) + 1;

    const b =
      Math.floor(
        Math.random() * a
      );

    questions.push({
      question:
        `${a} - ${b}`,

      answer:
        a - b,

      operation:
        "subtraction",

      difficulty:
        "easy",
    });
  }

  await Question.insertMany(
    questions
  );

  console.log(
    `${questions.length} Questions Inserted`
  );

  process.exit();
}

seedQuestions();