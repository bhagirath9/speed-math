import NextAuth, { DefaultSession } from "next-auth";

// Augment the next-auth module interfaces to include custom user/session properties
declare module "next-auth" {
  // Extends Session object to supply user's custom properties inside useSession hook
  interface Session {
    user: {
      id: string;
      isSpeedMathPurchased: boolean;
    } & DefaultSession["user"];
  }

  // Extends User object signature returned from providers/callbacks
  interface User {
    id: string;
    isSpeedMathPurchased: boolean;
  }
}

// Augment the next-auth JWT signature to support session persistence properties
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isSpeedMathPurchased: boolean;
  }
}

