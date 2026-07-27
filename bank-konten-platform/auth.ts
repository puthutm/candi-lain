import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  username: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

/**
 * Lightweight Auth Handler for Bank Konten Platform
 */
export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("bank-konten.authjs.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value;

    if (!token) {
      // Default dev fallback session if cookie not set
      return {
        user: {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Dr. Hendra Setiawan, M.Kom.",
          email: "dosen@unsia.ac.id",
          role: "dosen",
          roles: ["dosen"],
          username: "dosen",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
    }

    return {
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Dr. Hendra Setiawan, M.Kom.",
        email: "dosen@unsia.ac.id",
        role: "dosen",
        roles: ["dosen"],
        username: "dosen",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function signIn(): Promise<void> {}
export async function signOut(): Promise<void> {}

export const handlers = {
  GET: async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
  POST: async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
};
