import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireServerSecret } from "@/lib/security/secrets";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sendSecurityEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Human verification", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }
        if (!(await verifyTurnstile(credentials.turnstileToken || ""))) throw new Error("Human verification failed.");

        const email = credentials.email.toLowerCase().trim();
        const loginLimit = await checkRateLimit("login", email, 8, 15 * 60 * 1000);
        if (!loginLimit.allowed) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { preferences: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account temporarily locked. Try again later or reset your password.");
        }

        if (process.env.RESEND_API_KEY && !user.emailVerifiedAt) {
          throw new Error("Verify your email address before signing in.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1;
          const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts >= 5 ? 0 : attempts, lockedUntil } });
          if (lockedUntil) await sendSecurityEmail(user.email, "ScamCheck account temporarily locked", "<p>Your account was temporarily locked after repeated unsuccessful sign-in attempts. You can wait 15 minutes or reset your password.</p>");
          throw new Error("Invalid email or password");
        }

        await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          language: user.preferences?.language || user.language,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.language = (user as any).language || "en";
      }
      if (trigger === "update" && session?.language) {
        token.language = session.language;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).language = token.language as string;
      }
      return session;
    },
  },
  secret: requireServerSecret("NEXTAUTH_SECRET"),
};
