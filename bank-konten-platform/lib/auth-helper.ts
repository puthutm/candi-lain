import { auth } from "@/auth";

export interface UserProfile {
  userId: string;
  name: string;
  username: string;
  role: string; // 'dosen' | 'verifikator_prodi' | 'verifikator_bpm' | 'admin_bank_konten'
}

export async function getSessionUser(): Promise<UserProfile | null> {
  try {
    const session = await auth();
    if (!session || !session.user) return null;
    return {
      userId: (session.user as any).id || "",
      name: session.user.name || "",
      username: (session.user as any).username || "",
      role: (session.user as any).role || "dosen",
    };
  } catch {
    return null;
  }
}
