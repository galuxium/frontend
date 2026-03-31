"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/SessionContext";
import SearchBar from "@/components/AI/SearchBar";

import { FileText, Palette, Presentation } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import { useSmartAutoScroll } from "@/hooks/useSmartAutoScroll";
import { supabase } from "@/lib/supabase";
import { classifyIdea } from "@/lib/classifyIdea";
import FoundersModeBanner from "@/components/FoundersModeBanner";

import AgentCard from "@/components/AgentCard";
import { AgentData, ProfileForm } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export type Role = "user" | "assistant" | "system";
interface ReportData {
  pdf: string;
  pptx: string;
  logos: string[];
  palette?: string;
  idea_id: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  user_id?: string | null;
  model_slug?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id?: string;
  user_id?: string | null;
  role: Role;
  content: string;
  model_used?: string | null;
  created_at?: string;
}
export interface ModelOption {
  name: string;
  id: string;
  description: string;
}

function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export default function AiChat() {
  /* ------------------------- state & refs (unchanged) ------------------------- */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [userTokensUsed, setUserTokensUsed] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<"free" | "premium">("free");

  const [isFoundersMode, setIsFoundersMode] = useState(false);
  const [ideaDetected, setIdeaDetected] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModel] = useState<string | null>(null);

  const { containerRefChat, bottomRef, autoScroll, scrollToBottom } =
    useSmartAutoScroll<HTMLDivElement>([messages]);
  const [toast, setToast] = useState<string | null>(null);

  const { session } = useSession();
  const userId: string | null = session?.user?.id ?? null;
    const [profile, setProfile] = useState<ProfileForm>({
      name: "",
      avatar_url: "",
      email: "",
      username: "",
      plan: "free",
      tokens_used: 0,
      userTokens:0,
      assistantTokens:0
    });

  useEffect(() => {
    if (isFoundersMode) document.body.classList.add("founders-mode");
    else document.body.classList.remove("founders-mode");
  }, [isFoundersMode]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  /* ------------------------- load user info & models ------------------------ */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const userDataResp = await supabase
          .from("users")
          .select("tokens_used, plan,userTokens,assistantTokens,name")
          .eq("id", userId)
          .single();

        if (userDataResp.error) throw userDataResp.error;
        const userData = userDataResp.data;
        setUserTokensUsed(userData.tokens_used);
        setUserPlan(userData.plan);
        if (userData) setProfile(userData as ProfileForm)
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    })();
  }, [userId, session]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/models`);
        const json = await res.json();
        const data = json?.data ?? [];
        setModels(data);
        if (data.length > 0) setModel(data[0].id);
      } catch (e) {
        console.warn("Failed to fetch models", e);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/list?userId=${encodeURIComponent(userId)}`);
        if (!r.ok) return;
        const j = await r.json();
        if (Array.isArray(j.data)) {
          setConversations(j.data as Conversation[]);
        }
      } catch (err) {
        console.warn("Failed to load conversations", err);
      }
    })();
  }, [userId]);

  /* ----------------------------- URL <-> active sync ----------------------------- */
  useEffect(() => {
    const cidFromUrl = searchParams?.get?.("cid") ?? null;
    if (cidFromUrl) {
      setActiveConversationId((prev) => (prev === cidFromUrl ? prev : cidFromUrl));
      return;
    }
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [searchParams, conversations, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const search = new URLSearchParams(window.location.search);
    if (search.get("cid") === activeConversationId) return;
    search.set("cid", activeConversationId);
    router.replace(`${window.location.pathname}?${search.toString()}`, { scroll: false });
  }, [activeConversationId, router]);

  /* ------------------------- fetch messages for active ------------------------ */
  useEffect(() => {
    const cid = activeConversationId;
    if (!cid) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${encodeURIComponent(cid)}`);
        if (!r.ok) {
          console.warn("fetch messages failed status", r.status);
          return;
        }
        const j = await r.json();
        const arr = Array.isArray(j.data) ? (j.data as Message[]) : [];
        setMessages(arr);
      } catch (err) {
        console.warn("fetch messages failed", err);
      }
    })();
  }, [activeConversationId]);

  /* ------------------------------- helpers -------------------------------- */
  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

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

  const [agentOutputs, setAgentOutputs] = useState<AgentData[]>([]);

  /* ------------------------- create conversation helper ------------------------ */
  const createConversation = useCallback(
    async (title = "New chat") => {
      if (!userId) {
        showToast("You must be signed in");
        return null;
      }
      try {
        const payload = { userId, title, model };
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const txt = await r.text();
          console.error("create convo err", txt);
          showToast("Failed to create conversation");
          return null;
        }
        const j = await r.json();
        if (j.data && j.data.id) {
          setConversations((c) => [j.data as Conversation, ...c]);
          setActiveConversationId(j.data.id as string);
          return j.data.id as string;
        }
      } catch (err) {
        console.error(err);
        showToast("Network error while creating conversation");
        return null;
      }
      return null;
    },
    [userId, model, showToast]
  );

  /* ------------------------------- sendMessage ------------------------------- */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!userId) {
        showToast("You must be signed in");
        return;
      }

      const userTokens = estimateTokensFromText(text);
      if (userPlan === "free" && userTokensUsed + userTokens > 5000) {
        showToast(`Free plan limit reached (5,000 tokens). Upgrade for more.`);
        return;
      }

      // ensure conversation exists
      let cid = activeConversationId;
      if (!cid) {
        const newCid = await createConversation(text.slice(0, 50) || "New chat");
        if (!newCid) return;
        cid = newCid;
      }

      // user message local + backend
      const userMsg: Message = {
        id: uuidv4(),
        conversation_id: cid!,
        user_id: userId,
        role: "user",
        content: text,
        model_used: model,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      void saveMessageToBackend(userMsg);

      // assistant placeholder
      const assistantId = uuidv4();
      const assistantPlaceholder: Message = {
        id: assistantId,
        conversation_id: cid!,
        user_id: userId,
        role: "assistant",
        content: "",
        model_used: model,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantPlaceholder]);
      setIsStreaming(true);

      const history = messagesRef.current
        .filter((m) => m.conversation_id === cid && (m.role === "user" || m.role === "assistant"))
        .map((m) => ({ role: m.role as Role, content: m.content }));
      history.push({ role: "user", content: text });

      let classification;
      try {
        classification = await classifyIdea(text);
      } catch {
        classification = { is_startup_idea: false, idea: text };
      }

      if (classification.is_startup_idea) {
        setIsFoundersMode(true);
        setIdeaDetected(classification.idea);
        const audio = new Audio("/sounds/founders-mode.mp3");
        audio.volume = 0.8;
        audio.play().catch(() => console.warn("Autoplay blocked"));
      } else {
        setIsFoundersMode(false);
        setIdeaDetected(null);
      }

      // orchestration branch
      if (classification.is_startup_idea) {
        showToast("🧬 Initializing Galuxium Multi-Agent Orchestration...");
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orchestrator?idea=${encodeURIComponent(classification.idea)}&user_id=${userId}`;
         const logs: {
    timestamp: string;
    phase: string;
    sub_phase?: string | null;
    message: string;
    progress?: number | null;
    file_url?: string | null;
  }[] = [];

        const eventSource = new EventSource(url);
        setIsStreaming(true);
        let currentIdeaId: string | null = null;

        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.error) {
              showToast(`❌ ${data.error}`);
              console.error("Stream error:", data.error);
              return;
            }
            if (data.idea_id && !currentIdeaId) currentIdeaId = data.idea_id;
            logs.push({
              timestamp: new Date().toISOString(),
              phase: data.phase || "unknown",
              sub_phase: data.sub_phase || null,
              message: data.message || "",
              progress: data.progress || 0,
              file_url: data.file_url || null,
            });

            if (data.phase) {
              setAgentOutputs((prev) => {
                const existing = prev.find((a) => a.phase === data.phase);
                if (existing) {
                  return prev.map((a) =>
                    a.phase === data.phase ? { ...a, ...data, messages: [...(a.messages || []), data.message] } : a
                  );
                }
                return [...prev, { ...data, messages: [data.message] }];
              });
            }

            if (data.done) {
              showToast("🎯 All Galuxium Agents completed!");
              setIsStreaming(false);
              try {
                const { data: supRes, error } = await supabase.from("orchestration_logs").insert([
                  {
                    user_id: userId,
                    idea_id: currentIdeaId,
                    logs: JSON.parse(JSON.stringify(logs)),
                    created_at: new Date().toISOString(),
                  },
                ]).select();
                console.log("Supabase insert result:", { data: supRes, error });

                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report/generate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idea_id: currentIdeaId }),
                });
                const json = await res.json();
                setReport(json.uploads);

                const finalAssistantMsg: Message = {
                  id: assistantId,
                  conversation_id: cid!,
                  user_id: userId,
                  role: "assistant",
                  content: JSON.parse(JSON.stringify(logs)),
                  model_used: model,
                  created_at: new Date().toISOString(),
                };
                void saveMessageToBackend(finalAssistantMsg);
              } catch (e) {
                console.error("Failed to save logs", e);
              }
              eventSource.close();
            }
          } catch (err) {
            console.warn("Stream parse error:", err);
          }
        };

        eventSource.onerror = (err) => {
          console.error("SSE connection failed:", err);
          setIsStreaming(false);
          eventSource.close();
        };

        return;
      }

      // normal chat fallback
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            userMessages: history,
            modelProfile: {
              system_prompt:
                "You are Galuxium — an advanced assistant that is helpful, concise, and friendly. You were founded by Aaditya Salgaonkar.",
            },
          }),
        });

        if (!resp.ok) throw new Error(`OpenRouter call failed: ${resp.status}`);
        const json = await resp.json();

        const reply =
          json?.providerResp?.choices?.[0]?.message?.content ??
          json?.providerResp?.choices?.[0]?.text ??
          "…";

        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)));

        const assistantTokens = estimateTokensFromText(reply);

        const finalAssistantMsg: Message = {
          id: assistantId,
          conversation_id: cid!,
          user_id: userId,
          role: "assistant",
          content: reply,
          model_used: model,
          created_at: new Date().toISOString(),
        };
        void saveMessageToBackend(finalAssistantMsg);

        const totalTokensUsed = userTokens + assistantTokens;
        setUserTokensUsed((prev) => prev + totalTokensUsed);

        void fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/updateTokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, tokens: totalTokensUsed, userTokens, assistantTokens }),
        });
      } catch (err) {
        console.error("sendMessage error", err);
        showToast("AI response failed");
      } finally {
        setIsStreaming(false);
      }
    },
    [
      activeConversationId,
      model,
      saveMessageToBackend,
      showToast,
      userId,
      userPlan,
      userTokensUsed,
      createConversation,
    ]
  );

  /* ----------------------------- sorted convos ---------------------------- */
  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : a.created_at ? new Date(a.created_at!).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : b.created_at ? new Date(b.created_at!).getTime() : 0;
    return dateB - dateA;
  });

  useEffect(() => {
    if (sortedConversations.length === 0) return;
    if (activeConversationId === null) {
      const newest = sortedConversations[0];
      setActiveConversationId(newest.id);
    }
  }, [sortedConversations, activeConversationId]);


  /* ------------------------------- rendering ------------------------------ */
  const currentMessages = messages.filter((m) => m.conversation_id === activeConversationId);

  return (
    <>
      

      <div className="h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 flex relative overflow-hidden">
        <div className="h-full w-full flex">
         

          <main className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="border-b shadow-sm z-10 border-gray-200 dark:border-gray-800 px-6 h-[60px] flex items-center justify-between">
              <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">Hey there, {profile.name}!</h1>

              <div className="flex items-center gap-4">
                {isFoundersMode && ideaDetected && <FoundersModeBanner idea={ideaDetected} />}
              
              </div>
            </div>

            {/* messages container */}
            <div ref={containerRefChat} className="flex-1 min-h-0 px-8 py-6 overflow-y-auto custom-scrollbar">
              {/* If empty conversation - center the SearchBar hero */}
              {(!currentMessages || currentMessages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <div className="text-center max-w-xl">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Ask Galuxium anything</h2>
                    <p className="text-gray-500 dark:text-gray-400">Start a new conversation — your prompt will become the chat title.</p>
                  </div>

                  <div className="w-full max-w-2xl">
                   <SearchBar
  disabled={isStreaming || !session?.user?.id}
  onSend={(t) => void sendMessage(t)} // sendMessage uses parent `model` state
  scrollToBottom={scrollToBottom}
  autoScroll={autoScroll}
  models={models}                      // pass model list
  selectedModel={model ?? undefined}   // current selection from AiChat state
  onModelChange={(id) => setModel(id)} // update parent model when changed in SearchBar
/>

                  </div>

                </div>
              ) : (
                <div className="space-y-4 mb-50">
                  <div className={`transition-all duration-700 ${isFoundersMode ? "animate-pulse-slow" : ""}`}>
                    {currentMessages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        msg={m}
                        model={models.find((mdl) => mdl.id === m.model_used)?.name || m.model_used || ""}
                      />
                    ))}
                  </div>

                  {agentOutputs.map((a) => (
                    <AgentCard key={a.phase} agent={a} />
                  ))}

                  {report && (
                    <div className="relative mt-5 mb-10 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/25 backdrop-blur-xl shadow-xl p-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-transparent pointer-events-none" />
                      <div className="relative z-10 space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-[#2e147e]">Your Generated Report</h3>
                          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{new Date().toLocaleDateString()}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          {report?.pdf && <Link href={report.pdf} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md"><FileText size={18} /> View PDF</Link>}
                          {report?.pptx && <Link href={report.pptx} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-md"><Presentation size={18} /> Download Deck</Link>}
                        </div>

                        {report?.palette && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-[#2e147e] flex items-center gap-2"><Palette size={16} /> Brand Palette</h4>
                            <div className="mt-3 relative w-full max-w-sm">
                              <Image src={report.palette} alt="Palette" width={400} height={200} className="rounded-xl shadow-lg ring-1 ring-white/20" />
                            </div>
                          </div>
                        )}

                        {report?.logos?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-[#2e147e]">Generated Logos</h4>
                            <div className="mt-3 flex flex-wrap gap-3">
                              {report.logos.map((url, i) => (
                                <div key={i} className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-105 transition-transform">
                                  <Image src={url} alt={`Logo ${i + 1}`} width={100} height={100} className="rounded-lg" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* SearchBar docked at bottom if there are messages */}
            {currentMessages && currentMessages.length > 0 && (
              <div className="absolute left-0 right-0 bottom-0 p-6 pointer-events-auto">
                <div className="mx-auto max-w-4xl">
                  <SearchBar
  disabled={isStreaming || !session?.user?.id}
  onSend={(t) => void sendMessage(t)} // sendMessage uses parent `model` state
  scrollToBottom={scrollToBottom}
  autoScroll={autoScroll}
  models={models}                      // pass model list
  selectedModel={model ?? undefined}   // current selection from AiChat state
  onModelChange={(id) => setModel(id)} // update parent model when changed in SearchBar
/>

                </div>
              </div>
            )}
          </main>

          
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded shadow"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
