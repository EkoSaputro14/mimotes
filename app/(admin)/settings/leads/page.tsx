import SettingsLayout from "@/components/settings/settings-layout";
import { LeadsTable } from "@/components/leads/leads-table";

export default function LeadsPage() {
  return (
    <SettingsLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>
      <div id="main-content" tabIndex={-1}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            View and manage leads captured through your chatbot widgets.
          </p>
        </div>
        <LeadsTable />
      </div>
    </SettingsLayout>
  );
}
