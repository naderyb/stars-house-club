import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/AdminAuthForms";
import { getSession } from "@/lib/admin/session";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect(session.mc ? "/admin/setup" : "/admin");

  return (
    <main className="container" style={{ paddingBlock: "3rem", maxWidth: 520 }}>
      <LoginForm />
    </main>
  );
}
