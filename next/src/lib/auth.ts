import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { isDbConfigured } from '@/lib/db';
import { authConfig } from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // If no DB is configured, deny all logins
        if (!isDbConfigured()) return null;

        const { db } = await import('@/lib/db');
        const { users } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');
        const bcrypt = (await import('bcryptjs')).default;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
