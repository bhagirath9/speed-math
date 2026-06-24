# Speed Math Module - Development Task

## Reference

Design and functionality inspiration:
https://cracku.in/speedmath

## Technology Stack

• Next.js
• TypeScript (TSX)
• Bootstrap
• Inline CSS (existing project pattern)
• NextAuth Authentication
• MongoDB
• Fully Responsive UI (Mobile, Tablet, Desktop)

## Question Categories

Provide 4 categories:

1. Addition
2. Subtraction
3. Multiplication
4. Division

## Difficulty Levels

Easy, Medium, Hard

## Purchase Based Access Control

### Purchased Users

Users who have purchased the Speed Math course/package can:

✅ Access all question categories

• Addition
• Subtraction
• Multiplication
• Division

✅ Change difficulty level

• Easy
• Medium
• Hard

### Non-Purchased Users

Users who have NOT purchased the Speed Math course/package can:

✅ Access only:

• Addition
• Subtraction

❌ Multiplication locked

❌ Division locked

❌ Cannot change difficulty level

• Default difficulty = Easy

## Question Attempt Logic

### Important Rule

Once a user attempts a question:

• That question should never be shown again to the same user.
• Applicable across all sessions.
• Persist in database.
