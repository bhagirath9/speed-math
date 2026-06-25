# Speed Math - Complete Business Flow & Architecture

This document outlines the complete business logic, access control, and technical flow for the **Speed Math** project. It serves as a comprehensive guide for understanding how the application handles authentication, premium access, and core practice features.

## 1. Landing Page (`/speed-math`)
- **Hero Section:** "CAT Speed Maths Practice Questions"
- **Stats Cards:** Showcasing metrics like 20K+ Users, 4 Operations, and 3 Difficulty Levels.
- **Sticky Practice Box:** Always visible on the right side.
  - **Operations:** Addition, Subtraction, Multiplication, Division.
  - **Difficulties:** Easy, Medium, Hard.

## 2. Access Control Logic

### Guest User (Not Logged In)
- **Allowed:** 
  - Operations: Addition (✅), Subtraction (✅)
  - Difficulty: Easy (✅)
- **Locked:** 
  - Operations: Multiplication (❌), Division (❌)
  - Difficulty: Medium (❌), Hard (❌)
- **Behavior:** Clicking a locked option (e.g., Multiplication or Medium) triggers the **Login Modal**.

## 3. Login Modal
- **Options:**
  - Login with Mobile
  - Email & Password
  - Continue with Google (OAuth)
  - Sign Up option
- Submit: Triggers `POST /api/login` or NextAuth Google Login.
- Post-Login: Session is created.

## 4. Register Flow
- **Fields:** Name, Email, Password, Confirm Password.
- **Action:** `POST /api/register`
- **Database:** User saved in MongoDB. Passwords hashed using `bcrypt`.

## 5. Purchase Check (Premium Access)
Upon login, the system evaluates `user.hasPurchasedSpeedMath` (or similar logic).

### Purchased User (Premium)
- **Allowed:** All Operations (Addition, Subtraction, Multiplication, Division) and All Difficulties (Easy, Medium, Hard).

### Non-Purchased User (Free Tier)
- **Allowed:** Addition, Subtraction, Easy.
- **Locked:** Multiplication, Division, Medium, Hard.
- **Behavior:** Clicking a locked option (e.g., Hard) triggers the **Premium Required Modal**.

## 6. Start Practice
When the user clicks "Let's Get Started", a request is made to initialize the practice session:

**API:** `POST /api/start-practice`
```json
{
  "userId": "123",
  "operation": "addition",
  "difficulty": "easy"
}
```

## 7. No Repeat Question Logic (Core Feature)
To ensure users never see repeated questions, we track attempts in a dedicated `QuestionAttempt` collection.

- **Storage Format:**
```json
{
  "userId": "123",
  "questionId": "Q101"
}
```
- **Logic:** When practice starts, fetch all `questionId`s the user has attempted.
- **MongoDB Query:**
```typescript
Question.find({
  _id: {
    $nin: attemptedIds
  }
})
```
*Result:* Excludes already solved questions, guaranteeing fresh questions whether they practice today, tomorrow, or a month later.

## 8. Practice Screen
- **Header:** Question X of 10.
- **Timer:** e.g., 00:15
- **Question Display:** e.g., `25 + 18`
- **Input Field:** `[________]`
- **Focus Mode:** Hides Navbar, Header, Footer, and Sidebar, keeping only the Question, Timer, and Answer Box visible to minimize distractions.

## 9. Submit Answer
- **Correct Answer:** Automatically proceeds to the next question.
- **Wrong Answer:** Highlights input with a Red Border, then proceeds to the next question.
- **Data Saving:** Every answer triggers an API call to save the attempt.

**API:** `POST /api/save-attempt`
```json
{
  "userId": "123",
  "questionId": "Q102",
  "isCorrect": true
}
```

## 10. Result Generation
After completing all 10 questions, the system calculates:
- Correct Answers
- Wrong Answers
- Accuracy (e.g., 80%)
- Time Taken

**Save Result API:** `POST /api/save-result`
```json
{
  "userId": "123",
  "operation": "addition",
  "difficulty": "easy",
  "correctAnswers": 8,
  "accuracy": 80
}
```

## 11. Result Page
- **Visuals:** Score Circle (e.g., 80%).
- **Stats:** Correct: 8, Wrong: 2, Time: 45 sec.
- **Actions:** 
  - **Play Again:** Triggers `/api/start-practice` again. Due to the No Repeat logic, fresh questions are generated.
  - **Back to Dashboard.**

## 12. MongoDB Collections
1. `Users`
2. `Results`
3. `Questions`
4. `QuestionAttempts`
