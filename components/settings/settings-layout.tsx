"use client";

import SettingsNav from "./settings-nav";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <SettingsNav />
      <main
        id="settings-content"
        role="tabpanel"
        className="flex-1 overflow-auto p-6 lg:p-8"
        tabIndex={-1}
      >
        <div className="max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
