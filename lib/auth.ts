import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { resolveWorkspaceId } from "@/lib/prisma";

/**
 * Helper: extract workspaceId from user ID.
 * Fire-and-forget — errors logged but never thrown.
 */
async function getWorkspaceForUser(userId: string): Promise<string | null> {
  try {
    return await resolveWorkspaceId(userId);
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  debug: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          // Log failed login attempt (no workspace yet — use system)
          logAudit({
            workspaceId: "system",
            actorId: credentials.email as string,
            actorType: "user",
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            metadata: { reason: "user_not_found", email: credentials.email },
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Log failed login attempt
          const wsId = await getWorkspaceForUser(user.id);
          logAudit({
            workspaceId: wsId || "system",
            actorId: user.id,
            actorType: "user",
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            metadata: { reason: "invalid_password" },
          });
          return null;
        }

        // Check if user is suspended
        if (user.suspended) {
          logAudit({
            workspaceId: "system",
            actorId: user.id,
            actorType: "user",
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            metadata: { reason: "user_suspended", suspendedAt: user.suspendedAt },
          });
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Log successful login
      if (user?.id) {
        const wsId = await getWorkspaceForUser(user.id);
        logAudit({
          workspaceId: wsId || "system",
          actorId: user.id,
          actorType: "user",
          action: AUDIT_ACTIONS.LOGIN,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // On sign-in, resolve the default workspace and embed it in the JWT
        if (user.id) {
          try {
            const wsId = await resolveWorkspaceId(user.id);
            token.selectedWorkspaceId = wsId;
          } catch {
            // If workspace resolution fails, leave it undefined — fallback in resolveWorkspaceId
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).user.selectedWorkspaceId = token.selectedWorkspaceId as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      // Log logout — JWT strategy provides token
      const token = "token" in message ? message.token : null;
      if (token?.id) {
        const wsId = await getWorkspaceForUser(token.id as string);
        logAudit({
          workspaceId: wsId || "system",
          actorId: token.id as string,
          actorType: "user",
          action: AUDIT_ACTIONS.LOGOUT,
        });
      }
    },
  },
});
