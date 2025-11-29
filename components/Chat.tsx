"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { useParams} from "next/navigation";

import MessageBubble from "@/components/MessageBubble";
import SearchBar from "@/components/AI/SearchBar";
import { useSmartAutoScroll } from "@/hooks/useSmartAutoScroll";
import { useSession } from "@/lib/SessionContext";
import type { Message, ModelOption  } from "@/lib/types";

import { TbGalaxy } from "react-icons/tb";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { FaEnvelopeOpenText } from "react-icons/fa";

import { LuMessageSquareShare } from "react-icons/lu";
import ShareModal from "./ShareModal";
export default function Chat({
  initialConversation,
    activeConversationId,
  setActiveConversationId,
}: {
initialConversation?: { id: string; data: Message[] };
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}) {

  const { session } = useSession();
  const userId = session?.user?.id;
  const params = useParams();
  const conversationIdFromUrl = params?.conversationId as string | undefined;

  /* ------------------------- State ------------------------- */
  // const [activeConversationId, setActiveConversationId] = useState<
  //   string | null
  // >(initialConversation?.id || conversationIdFromUrl || null);
  const [messages, setMessages] = useState<Message[]>(
    initialConversation?.data ?? []
  );
  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { containerRefChat, bottomRef, autoScroll, scrollToBottom } =
    useSmartAutoScroll<HTMLDivElement>([messages]);


  /* ------------------------- Toast Helper ------------------------- */
  const showToast = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* ------------------------- Load Model List ------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/models`
        );
        const json = await res.json();
        setModels(json?.data ?? []);
        if (json?.data?.length > 0) setModel(json.data[0].id);
      } catch (err) {
        console.warn("Failed to fetch models", err);
      }
    })();
  }, []);

  /* ------------------------- Save message helper ------------------------- */
  const saveMessageToBackend = useCallback(async (m: Message) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: m.conversation_id,
          userId: m.user_id ?? null,
          role: m.role,
          content: m.content,
          model: m.model_used ?? null,
        }),
      });
    } catch (err) {
      console.warn("saveMessage failed", err);
    }
  }, []);

 const { createConversation } = useCreateConversation({ model, setActiveConversationId, showToast: () => {} });


  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== activeConversationId) {
      setActiveConversationId(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl, activeConversationId, setActiveConversationId]);
  /* ------------------------- Send message ------------------------- */
/* ------------------------- Send message ------------------------- */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      let cid = activeConversationId;

      // ✅ Step 1: Handle New Conversation Creation
      if (!cid) {
        
        // 1. Create the conversation on backend
        const newCid = await createConversation(text.slice(0, 50));
        if (!newCid) return;
        
        cid = newCid;
        
        // 2. Update Local State immediately
        setActiveConversationId(newCid);

        // 3. SILENTLY update URL to prevent component remounting
        // This stops Next.js from killing the current component instance
        window.history.pushState(null, "", `/chat/${newCid}`);
      }

      const userMsgId = uuidv4();
      const assistantMsgId = uuidv4();
      const createdAt = new Date().toISOString();

      // ✅ Step 2: Optimistic UI Update (User + Loading Assistant)
      const userMsg: Message = {
        id: userMsgId,
        conversation_id: cid!,
        user_id: userId,
        role: "user",
        content: text,
        model_used: model,
        created_at: createdAt,
      };

      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        conversation_id: cid!,
        user_id: userId,
        role: "assistant",
        content: "", // Starts empty (streaming indicator)
        model_used: model,
        created_at: createdAt,
      };

      // Atomic update ensures both appear instantly
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      void saveMessageToBackend(userMsg);
      setIsStreaming(true);

      // ✅ Step 3: Fetch Response
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/search`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              model,
              // Filter logic ensures we send clean history
              userMessages: [
                ...messages
                  .filter((m) => m.role !== "system" && m.conversation_id === cid)
                  .map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: text },
              ],
            }),
          }
        );
        
        const json = await resp.json();
        const reply =
          json?.providerResp?.choices?.[0]?.message?.content ??
          json?.providerResp?.choices?.[0]?.text ??
          "…";

        // ✅ Step 4: Update the Placeholder
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: reply } : m
          )
        );

        const finalMsg: Message = { ...assistantPlaceholder, content: reply };
        void saveMessageToBackend(finalMsg);

      } catch (err) {
        console.error("sendMessage error", err);
        showToast("AI response failed");
        // Update placeholder to show error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: "Error: Could not generate response." } : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      activeConversationId,
      model,
      userId,
      messages,
      createConversation,
      saveMessageToBackend,
      showToast,
      setActiveConversationId,
    ]
  );

  /* ------------------------- Render ------------------------- */
  const currentMessages = useMemo(
    () => messages.filter((m) => m.conversation_id === activeConversationId),
    [messages, activeConversationId]
  );

  const handleExport = async () => {
    try {
      const cid = activeConversationId;
      if (!cid) {
        return;
      }
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${encodeURIComponent(
          cid
        )}`
      );
      if (!r.ok) {
        return;
      }
      const j = await r.json();
      const arr: Message[] = Array.isArray(j.data) ? j.data : [];
      const txt = arr
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");
      const blob = new Blob([txt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `galuxium-${cid}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <div className="h-screen flex flex-col">
       
        <header className=" h-[7vh] text-center justify-center flex items-center px-4 shadow-xs shadow-secondary ">
          
          <h1 className="text-xl font-normal  text-primary-text">Galuxium</h1>
          {
            currentMessages.length !==0 && (
              <div className="px-3 flex flex-row gap-1 md:gap-5 absolute right-0 md:right-10">
                  <button
                   onClick={() => setIsShareOpen(true)}
                    className={`w-full flex px-2 py-1 flex-row gap-2 text-left text-sm hover:bg-secondary/50  rounded-md  `}
                  >
                    <LuMessageSquareShare  size={20}/>
                   <p className="hidden md:block">Share</p>
                  </button>
                  <button
                    onClick={handleExport}
                    className={`w-full flex px-2 py-1 flex-row gap-2 text-left text-sm hover:bg-secondary/50  rounded-md  `}
                  >
                     <FaEnvelopeOpenText color={"text-gray-700"} size={20} />
                    <p className="hidden md:block">Export</p>
                  </button>
                </div>
            ) 
          }
        </header>





        {/* Messages */}
        <div
          ref={containerRefChat}
          className="flex-1 px-5 md:px-8 py-6 overflow-y-auto custom-scrollbar"
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="text-center opacity-80">
  <p className="text-sm md:text-xl text-gray-500 flex flex-row gap-2 items-center">
    
     Powered by{" "}
    <span className="font-semibold text-primary animate-pulse flex flex-row gap-2 justify-center items-center">
      Galuxium Intelligence
      <TbGalaxy className="size-7"/>
    </span>
    
  </p>
</div>

              <SearchBar
                disabled={isStreaming}
                onSend={(t) => void sendMessage(t)}
                scrollToBottom={scrollToBottom}
                autoScroll={autoScroll}
                models={models}
                selectedModel={model ?? undefined}
                onModelChange={(id) => setModel(id)}
              />
            </div>
          ) : (
            <div className="pb-[15vh]">
              {currentMessages.map((m) => (
                <MessageBubble key={m.id} msg={m} model={m.model_used ?? ""} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        {currentMessages.length > 0 && (
            <div className="fixed bottom-5 left-0 right-0">
              <SearchBar
                disabled={isStreaming}
                onSend={(t) => void sendMessage(t)}
                scrollToBottom={scrollToBottom}
                autoScroll={autoScroll}
                models={models}
                selectedModel={model ?? undefined}
                onModelChange={(id) => setModel(id)}
              />
            </div>
        )}
      </div>
        <ShareModal
  open={isShareOpen}
  onClose={() => setIsShareOpen(false)}
  conversationId={activeConversationId!}
/>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
