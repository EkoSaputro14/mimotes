import SettingsLayout from "@/components/settings/settings-layout";
import AppearanceSettingsForm from "@/components/settings/appearance-settings-form";

export default function AppearanceSettingsPage() {
  return (
    <SettingsLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>
      <div id="main-content" tabIndex={-1}>
        <AppearanceSettingsForm />
      </div>
    </SettingsLayout>
  );
}
