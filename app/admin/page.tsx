import { cookies } from "next/headers";
import { verifyAdminToken, demoPasswordHint, ADMIN_COOKIE } from "@/lib/adminAuth";
import { PreferencesProvider } from "@/lib/prefs";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const authed = verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  return (
    <PreferencesProvider>
      {authed ? <AdminApp /> : <AdminLogin enabled={!!process.env.ADMIN_PASSWORD} demoHint={demoPasswordHint()} />}
    </PreferencesProvider>
  );
}
