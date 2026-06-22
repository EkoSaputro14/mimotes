import ChatWindow from "@/components/chat/chat-window";

export default function ChatPage() {
  return (
    <div id="main-content" className="h-[100dvh] flex flex-col pt-[env(safe-area-inset-top)]">
      <ChatWindow />
    </div>
  );
}
