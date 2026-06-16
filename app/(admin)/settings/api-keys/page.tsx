import SettingsLayout from "@/components/settings/settings-layout";
import ApiKeysSettings from "@/components/settings/api-keys-settings";

export default function ApiKeysSettingsPage() {
  return (
    <SettingsLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>
      <div id="main-content" tabIndex={-1}>
        <ApiKeysSettings />
      </div>
    </SettingsLayout>
  );
}
