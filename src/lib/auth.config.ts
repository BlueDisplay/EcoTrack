import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config (no Node.js-only imports).
 * Used by middleware.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [], // providers are added in auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdmin = nextUrl.pathname.startsWith('/admin');
      const isLoggedIn = !!auth?.user;

      if (isAdmin) {
        if (!isLoggedIn) return false;
        const role = (auth.user as { role?: string })?.role;
        if (role !== 'admin') return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'viewer';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
