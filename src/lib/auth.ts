import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Configuration options for NextAuth authentication mechanisms
export const authOptions: NextAuthOptions = {
  providers: [
    // Standard Credentials Provider configuration for Email and Password verification
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // Callback validating details, matching bcrypt passwords, and returning user profile objects
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Compare encrypted password in DB with the user-provided plaintext password
        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }

        // Return user payload to be stored inside NextAuth JWT tokens
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          isSpeedMathPurchased: user.isSpeedMathPurchased,
        };
      }
    })
  ],
  callbacks: {
    // JWT callback allows augmenting the default token structure with custom user metadata (e.g. premium status)
    async jwt({ token, user, trigger, session }) {
      if (token.sub) {
        await dbConnect();
        // Fetch up-to-date user details from MongoDB on token evaluation/renewal
        const dbUser = await User.findById(token.sub);
        if (dbUser) {
          token.isSpeedMathPurchased = dbUser.isSpeedMathPurchased;
          token.name = dbUser.name;
        }
      }
      
      if (user) {
        token.id = user.id;
        token.isSpeedMathPurchased = user.isSpeedMathPurchased;
      }

      // Handle updates triggered programmatically from the client (e.g. updating purchase status immediately)
      if (trigger === "update" && session) {
        token.isSpeedMathPurchased = session.isSpeedMathPurchased;
      }

      return token;
    },
    // Session callback binds custom JWT token values back to NextAuth's React useSession context
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || token.id;
        session.user.isSpeedMathPurchased = token.isSpeedMathPurchased;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  }
};
