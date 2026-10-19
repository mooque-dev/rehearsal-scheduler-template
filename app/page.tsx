import { PreferencesProvider } from "@/lib/prefs";
import ScheduleApp from "@/components/ScheduleApp";

export default function Home() {
  return (
    <PreferencesProvider>
      <ScheduleApp />
    </PreferencesProvider>
  );
}
