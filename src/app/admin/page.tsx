import { checkAdminStatus } from "@/app/actions/adminAuth";
import { AdminLoginClient } from "@/shared/admin/panels/AdminLoginClient";
import { AdminAppShell } from "./AdminAppShell";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await checkAdminStatus();

  if (!isAdmin) {
    return <AdminLoginClient />;
  }

  return <AdminAppShell />;
}
