import mongoose, { Schema, model, models } from "mongoose";

// Schema for user profile registrations and authentication data
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Ensures email uniqueness in database records
      lowercase: true, // Auto-converts inputs to lower-case to prevent case duplicates
      trim: true, // Strips outer whitespace
    },
    password: {
      type: String,
      required: [true, "Password is required"], // Stored as a secure bcrypt hash
    },
    isSpeedMathPurchased: {
      type: Boolean,
      default: false, // Default user registration starts with the free tier
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// Prevent compiled Mongoose model compilation errors during Hot Module Reloading in development
const User = models.User || model("User", UserSchema);

export default User;

