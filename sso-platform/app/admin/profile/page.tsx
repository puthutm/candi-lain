import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import AdminProfileClient from "./AdminProfileClient";

export default async function AdminProfilePage() {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    redirect("/");
  }

  return (
    <AdminProfileClient 
      user={{ 
        fullName: user.fullName, 
        email: user.email 
      }} 
    />
  );
}
export const dynamic = "force-dynamic";
