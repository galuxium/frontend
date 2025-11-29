"use client";
import Chat from "@/components/Chat";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const conversationIdFromUrl = params?.conversationId as string | undefined;

  // Initialize state directly from URL param to avoid the effect
  const initialConversationId = conversationIdFromUrl ?? null;

  // If no conversationId yet, show nothing or a loader
  if (!initialConversationId) return null;

  return (
    <Chat
      activeConversationId={initialConversationId}
      setActiveConversationId={() => {}} // handled by ClientWrapper
    />
  );
}
