"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import { Conversation } from "@/lib/types";

interface UseCreateConversationProps {
 model: string | null | undefined;
  setConversations?: (value: (prev: Conversation[]) => Conversation[]) => void;
  setActiveConversationId: (id: string | null) => void;
  showToast?: (msg: string) => void;
}

export function useCreateConversation({
  model,
  setConversations,
  setActiveConversationId,
  showToast
}: UseCreateConversationProps) {
  
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  const createConversation = useCallback(
    async (title = "New Chat") => {
      if (!userId) {
        showToast?.("You must be signed in");
        return null;
      }

      try {
        const payload = { 
          userId, 
          title, 
          model_slug: model,
          model: model
        };

        const r = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const j = await r.json();

        if (j?.data?.id) {
          const newId = j.data.id;

          // Optional: update sidebar conversation list
          if (setConversations) {
            setConversations((prev) => [j.data as Conversation, ...prev]);
          }

          // Active chat
          setActiveConversationId(newId);

          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete("cid");

          // Navigate
          router.push(`/chat/${newId}`, { scroll: false });

          return newId;
        }

        showToast?.("Failed to create conversation");
        return null;

      } catch (err) {
        console.error("createConversation error:", err);
        showToast?.("Network error");
        return null;
      }
    },
    [userId, model, router, setConversations, setActiveConversationId, showToast]
  );

  return { createConversation };
}
