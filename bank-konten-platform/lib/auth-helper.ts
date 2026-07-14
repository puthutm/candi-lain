import { cookies } from "next/headers";

export interface UserProfile {
  userId: string;
  name: string;
  username: string;
  role: string; // 'dosen' | 'verifikator_prodi' | 'verifikator_bpm' | 'admin_bank_konten'
}

export async function getSessionUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("bank_user");
    if (!sessionCookie) return null;
    return JSON.parse(sessionCookie.value) as UserProfile;
  } catch {
    return null;
  }
}
