import { getSessionUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?return_to=%2Fhome%2Fprofile");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          Kelola data profil Anda secara mandiri di SSO Platform.
        </p>

        <div className="mt-8">
          <ProfileForm initialUser={{ fullName: user.fullName, email: user.email }} />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
