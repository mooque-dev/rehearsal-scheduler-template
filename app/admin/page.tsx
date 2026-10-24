import { cookies } from "next/headers";
import { verifyAdminToken, demoPasswordHint, ADMIN_COOKIE } from "@/lib/adminAuth";
import { PreferencesProvider } from "@/lib/prefs";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminApp from "@/components/admin/AdminApp";
import { getBrandSafe } from "@/lib/data";
import { BrandProvider } from "@/components/BrandProvider";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const authed = verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  // admin shows the company's logo but keeps its own neutral look
  const brand = await getBrandSafe();
  return (
    <BrandProvider brand={brand}>
      <PreferencesProvider>
        {authed ? <AdminApp /> : <AdminLogin enabled={!!process.env.ADMIN_PASSWORD} demoHint={demoPasswordHint()} />}
      </PreferencesProvider>
    </BrandProvider>
  );
}
