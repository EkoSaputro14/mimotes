"use client";

import { useEffect } from "react";
import ChatWindow from "@/components/chat/chat-window";

export default function ChatPage() {
  useEffect(() => {
    const originalBody = document.body.style.overflow;
    const originalHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBody;
      document.documentElement.style.overflow = originalHtml;
    };
  }, []);

  return (
    <div
      id="main-content"
      className="fixed inset-0 flex flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]"
    >
      <ChatWindow />
    </div>
  );
}
