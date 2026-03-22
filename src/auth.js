// src/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api").replace(/\/$/, "");

export const authOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials) {
        try {
          const email = credentials?.email?.trim();
          const password = credentials?.password;
          if (!email || !password) return null;

          // ✅ endpoints reales (según tu curl)
          const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
          if (!loginRes.data?.token) return null;

          const backendToken = loginRes.data.token;

          const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${backendToken}` },
            withCredentials: true,
          });

          const u = meRes.data;
          if (!u?.id) return null;

          return {
            id: u.id,
            name: u.nombre || u.email,
            email: u.email,
            rol: u.rol,
            backendToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = user.backendToken;
        token.rol = user.rol;
        token.name = user.name;
        token.email = user.email;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken;
      session.user = {
        id: token.sub,
        name: token.name,
        email: token.email,
        rol: token.rol,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};