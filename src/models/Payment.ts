import mongoose, { Schema, model, models } from "mongoose";

// Sub-schema representing single check-out attempt details
const PaymentAttemptSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },
    transactionAmount: {
      type: Number,
      required: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Captures createdAt and updatedAt for each transaction attempt
  }
);

// Main Schema mapping a single user + course combination to their latest enrollment state and history
const PaymentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Customer email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Customer mobile number is required"],
      trim: true,
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    coursePrice: {
      type: Number,
      required: [true, "Course price is required"],
    },
    
    // Top level fields representing the LATEST payment attempt details
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      trim: true,
    },
    paymentId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },
    transactionAmount: {
      type: Number,
      required: [true, "Transaction amount is required"],
    },
    paidAt: {
      type: Date,
    },

    // Course Access & Enrollment Flags
    hasAccess: {
      type: Boolean,
      default: false,
    },
    enrollmentStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "INACTIVE",
    },

    // History log of all attempts
    attempts: [PaymentAttemptSchema],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields for the overall enrollment
  }
);

// Ensure there is exactly one payment/enrollment document per unique user email + course combination
PaymentSchema.index({ email: 1, courseName: 1 }, { unique: true });

// Safely clear cached compiled model in Next.js development to force Mongoose to register the updated schema with the attempts array
if (mongoose.models.Payment) {
  mongoose.deleteModel("Payment");
}

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;
