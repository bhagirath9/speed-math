import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize NextAuth configuration and export standard API handlers for GET and POST requests
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

