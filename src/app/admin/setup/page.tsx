import AdminNav from "@/components/admin/AdminNav";
import { CredentialsForm } from "@/components/admin/AdminAuthForms";
import { requireAdminPage } from "@/lib/admin/session";

export default async function AdminSetupPage() {
  const session = await requireAdminPage({ allowMustChange: true });

  return (
    <main
      className="container"
      style={{
        paddingBlock: "2rem",
        maxWidth: 560,
        display: "grid",
        gap: "1.5rem",
      }}
    >
      {/* no menu while the starter login is still active: nothing else is allowed yet */}
      {!session.mc && <AdminNav role={session.role} />}
      <CredentialsForm mustChange={session.mc} />
    </main>
  );
}
