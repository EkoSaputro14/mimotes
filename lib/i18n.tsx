"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "id" | "en";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  id: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.chat": "Chat",
    "nav.documents": "Dokumen",
    "nav.knowledge": "Pengetahuan",
    "nav.analytics": "Analitik",
    "nav.settings": "Pengaturan",
    "nav.whatsapp": "WhatsApp",
    
    // Settings
    "settings.title": "Pengaturan",
    "settings.back": "Kembali ke Dashboard",
    "settings.account": "Akun",
    "settings.ai": "Pengaturan AI",
    "settings.workspace": "Workspace",
    "settings.security": "Keamanan",
    "settings.notifications": "Notifikasi",
    "settings.api_keys": "API Keys",
    "settings.mcp": "MCP",
    "settings.widget": "Widget",
    "settings.leads": "Leads",
    "settings.whatsapp": "WhatsApp",
    "settings.baileys": "WhatsApp Baileys",
    "settings.billing": "Billing",
    "settings.invoices": "Invoice",
    "settings.audit": "Audit Logs",
    "settings.language": "Bahasa",
    
    // Common
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.edit": "Edit",
    "common.confirm": "Ya",
    "common.loading": "Memuat...",
    "common.no_data": "Tidak ada data",
    "common.search": "Cari...",
    
    // Documents
    "docs.title": "Dokumen",
    "docs.upload": "Upload",
    "docs.empty": "Belum ada dokumen",
    "docs.upload_first": "Upload Dokumen Pertama",
    
    // Chat
    "chat.title": "Chat",
    "chat.new": "Chat Baru",
    "chat.send": "Kirim",
    "chat.placeholder": "Ketik pesan...",
    
    // Billing
    "billing.plan": "Paket",
    "billing.free": "Gratis",
    "billing.pro": "Pro",
    "billing.enterprise": "Enterprise",
    "billing.upgrade": "Upgrade",
    "billing.manage": "Kelola",
    "billing.current_plan": "Paket Saat Ini",
    "billing.status": "Status",
    
    // Status
    "status.ready": "Siap",
    "status.processing": "Memproses...",
    "status.failed": "Gagal",
    "status.active": "Aktif",
    "status.trial": "Trial",
    "status.canceled": "Dibatalkan",
    
    // Dashboard
    "dashboard.welcome": "Selamat datang",
    "dashboard.documents": "Dokumen",
    "dashboard.chunks": "Sections",
    "dashboard.sessions": "Sesi Chat",
    "dashboard.messages": "Pesan",
    "dashboard.leads": "Leads",
    "dashboard.quick_actions": "Aksi Cepat",
    "dashboard.new_chat": "Chat Baru",
    "dashboard.upload_doc": "Upload Dokumen",
    "dashboard.settings": "Pengaturan",
    "dashboard.analytics": "Analitik",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.chat": "Chat",
    "nav.documents": "Documents",
    "nav.knowledge": "Knowledge",
    "nav.analytics": "Analytics",
    "nav.settings": "Settings",
    "nav.whatsapp": "WhatsApp",
    
    // Settings
    "settings.title": "Settings",
    "settings.back": "Back to Dashboard",
    "settings.account": "Account",
    "settings.ai": "AI Settings",
    "settings.workspace": "Workspace",
    "settings.security": "Security",
    "settings.notifications": "Notifications",
    "settings.api_keys": "API Keys",
    "settings.mcp": "MCP",
    "settings.widget": "Widget",
    "settings.leads": "Leads",
    "settings.whatsapp": "WhatsApp",
    "settings.baileys": "WhatsApp Baileys",
    "settings.billing": "Billing",
    "settings.invoices": "Invoice",
    "settings.audit": "Audit Logs",
    "settings.language": "Language",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.confirm": "Yes",
    "common.loading": "Loading...",
    "common.no_data": "No data",
    "common.search": "Search...",
    
    // Documents
    "docs.title": "Documents",
    "docs.upload": "Upload",
    "docs.empty": "No documents yet",
    "docs.upload_first": "Upload First Document",
    
    // Chat
    "chat.title": "Chat",
    "chat.new": "New Chat",
    "chat.send": "Send",
    "chat.placeholder": "Type a message...",
    
    // Billing
    "billing.plan": "Plan",
    "billing.free": "Free",
    "billing.pro": "Pro",
    "billing.enterprise": "Enterprise",
    "billing.upgrade": "Upgrade",
    "billing.manage": "Manage",
    "billing.current_plan": "Current Plan",
    "billing.status": "Status",
    
    // Status
    "status.ready": "Ready",
    "status.processing": "Processing...",
    "status.failed": "Failed",
    "status.active": "Active",
    "status.trial": "Trial",
    "status.canceled": "Canceled",
    
    // Dashboard
    "dashboard.welcome": "Welcome",
    "dashboard.documents": "Documents",
    "dashboard.chunks": "Sections",
    "dashboard.sessions": "Chat Sessions",
    "dashboard.messages": "Messages",
    "dashboard.leads": "Leads",
    "dashboard.quick_actions": "Quick Actions",
    "dashboard.new_chat": "New Chat",
    "dashboard.upload_doc": "Upload Document",
    "dashboard.settings": "Settings",
    "dashboard.analytics": "Analytics",
  },
};

const I18nContext = createContext<I18nContextValue>({
  lang: "id",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const stored = localStorage.getItem("mimotes-lang") as Lang | null;
    if (stored && (stored === "id" || stored === "en")) {
      setLangState(stored);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("mimotes-lang", newLang);
    document.documentElement.lang = newLang;
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations["id"][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
