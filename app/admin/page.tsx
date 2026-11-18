import { cookies } from "next/headers";
import { adminEnabled, verifyAdminToken, demoPasswordHint, ADMIN_COOKIE } from "@/lib/adminAuth";
import { PreferencesProvider } from "@/lib/prefs";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminApp from "@/components/admin/AdminApp";
import { getBrandSafe } from "@/lib/data";
import { BrandProvider } from "@/components/BrandProvider";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const authed = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  // admin shows the company's logo but keeps its own neutral look
  const brand = await getBrandSafe();
  return (
    <BrandProvider brand={brand}>
      <PreferencesProvider>
        {authed ? <AdminApp /> : <AdminLogin enabled={authed || (await adminEnabled())} demoHint={demoPasswordHint()} />}
      </PreferencesProvider>
    </BrandProvider>
  );
}
