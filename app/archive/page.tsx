import { cookies } from "next/headers";
import { verifyToken, ARCHIVE_COOKIE } from "@/lib/archiveAuth";
import { PreferencesProvider } from "@/lib/prefs";
import ArchivePinGate from "@/components/ArchivePinGate";
import ArchiveApp from "@/components/ArchiveApp";

export default async function ArchivePage() {
  const store = await cookies();
  const authed = verifyToken(store.get(ARCHIVE_COOKIE)?.value);

  if (!authed) {
    return <ArchivePinGate />;
  }

  return (
    <PreferencesProvider>
      <ArchiveApp />
    </PreferencesProvider>
  );
}
