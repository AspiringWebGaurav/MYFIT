import { checkAdminStatus } from "@/app/actions/adminAuth";
import { AdminLoginClient } from "@/desktop/panels/AdminLoginClient";
import { AdminShell } from "@/desktop/layouts/AdminShell";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await checkAdminStatus();

  if (!isAdmin) {
    return <AdminLoginClient />;
  }

  return <AdminShell />;
}
