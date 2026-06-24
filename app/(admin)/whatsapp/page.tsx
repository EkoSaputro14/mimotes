import { ConversationList } from "@/components/whatsapp/conversation-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const metadata = {
  title: "WhatsApp | MimoNotes",
};

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
          <p className="text-muted-foreground">
            Kelola percakapan WhatsApp dan pantau lead dari pelanggan.
          </p>
        </div>
        <Link href="/settings/whatsapp">
          <Button variant="outline" size="sm">
            <Settings className="size-4 mr-1.5" />
            Integrasi
          </Button>
        </Link>
      </div>
      <ConversationList />
    </div>
  );
}
