"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaTimes,
  FaTachometerAlt,
  FaCogs,
  FaGamepad,
  FaEnvelopeOpenText,
  FaPlus,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FaBolt, FaSignOutAlt, FaWindowMaximize } from "react-icons/fa";
import { useSession } from "@/lib/SessionContext";
import GlobalSettings from "./GlobalSettings";
import ConversationBubble from "./AI/ConversationBubble";
import type { Conversation, Message } from "@/lib/types";
import { SettingsIcon } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}


export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.jpg");
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
 
  const [model, setModel] = useState<string | null>(null);

  const userId: string | null = session?.user?.id ?? null;

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase.from("users").select("avatar_url").eq("id", session.user.id).single();
      setAvatarUrl((data)?.avatar_url || "/default-avatar.jpg");
    };
    fetchAvatar();
  }, [session?.user?.id]);

  // fetch models for the model selector
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/models`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
     
        if ((json.data ?? []).length > 0) setModel(json.data[0].id);
      } catch (err) {
        console.warn("Failed to fetch models", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
// realtime sync: listen for conversation updates (rename, new, delete)
useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel("conversations-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("Realtime update:", payload.eventType, payload.new);

        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          setConversations((prev) => {
            const exists = prev.find((c) => c.id === payload.new.id);
            if (exists) {
              // Update the title or updated_at field
              return prev.map((c) =>
                c.id === payload.new.id ? { ...c, ...payload.new } : c
              );
            } else {
              // Add new convo
              return [payload.new as Conversation, ...prev];
            }
          });
        } else if (payload.eventType === "DELETE") {
          setConversations((prev) =>
            prev.filter((c) => c.id !== payload.old.id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
useEffect(() => {
  const cid = searchParams?.get?.("cid");
  if (!userId || !cid) return;

  const reloadConversations = async () => {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/list?userId=${encodeURIComponent(userId)}`
    );
    if (!r.ok) return;
    const j = await r.json();
    if (Array.isArray(j.data)) setConversations(j.data);
  };
  reloadConversations();
}, [searchParams,userId]);

  // load conversations
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/list?userId=${encodeURIComponent(userId)}`);
        if (!r.ok) return;
        const j = await r.json();
        if (!Array.isArray(j.data)) return;
        if (!mounted) return;
        setConversations(j.data as Conversation[]);
        // If the URL provides a cid, prefer that for highlight; otherwise set newest locally
        const cidFromUrl = searchParams?.get?.("cid") ?? null;
        if (cidFromUrl) {
          setActiveConversationId(cidFromUrl);
        } else if (!activeConversationId && j.data.length > 0) {
          setActiveConversationId(j.data[0].id);
        }
      } catch (err) {
        console.warn("Failed to load conversations", err);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // keep activeConversationId in sync with URL param `cid` if user navigates manually
  useEffect(() => {
    const cidFromUrl = searchParams?.get?.("cid") ?? null;
    if (cidFromUrl && cidFromUrl !== activeConversationId) {
      setActiveConversationId(cidFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);



  const toggleCollapsed = () => setCollapsed(!collapsed);

  // Create a new conversation and switch to it (updates URL)
  const createConversation = useCallback(
    async (title = "New chat") => {
      try {
        if (!userId) {
   
          return;
        }
        const payload = { userId, title, model };
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const txt = await r.text();
      
          console.error("create convo err", txt);
          return;
        }
        const j = await r.json();
        if (j.data && j.data.id) {
          setConversations((c) => [j.data as Conversation, ...c]);
          // update URL with new cid so AiChat will switch
          const search = new URLSearchParams(window.location.search);
          search.set("cid", j.data.id);
          router.replace(`${window.location.pathname}?${search.toString()}`, { scroll: false });
          setActiveConversationId(j.data.id);
        }
      } catch (err) {
        console.error(err);
       
      }
    },
    [userId, model, router]
  );

  // open existing conversation: update URL (AiChat reads it)
  const openConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      const search = new URLSearchParams(window.location.search);
      search.set("cid", id);
      router.replace(`${window.location.pathname}?${search.toString()}`, { scroll: false });
    },
    [router]
  );

  // delete conversation
  const handleDelete = async (id: string) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to delete conversation");

      setConversations((prev) => prev.filter((c) => c.id !== id));
      // If deleted conversation was active -> remove cid from URL
      const search = new URLSearchParams(window.location.search);
      if (search.get("cid") === id) {
        search.delete("cid");
        router.replace(`${window.location.pathname}?${search.toString()}`, { scroll: false });
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
     
    }
  };

  // Export the conversation messages as .txt (fetch messages from backend then download)
  const handleExport = async () => {
    try {
      const cid = activeConversationId;
      if (!cid) {
   
        return;
      }
      const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${encodeURIComponent(cid)}`);
      if (!r.ok) {
    
        return;
      }
      const j = await r.json();
      const arr: Message[] = Array.isArray(j.data) ? j.data : [];
      const txt = arr.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
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

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    setLoading(false);
  };

  const menuItems = [
    { label: "Analytics", icon: <FaTachometerAlt />, path: "/analytics" },
    { label: "MVPs", icon: <FaCogs />, path: "/mvps" },
    { label: "Galuxium AI", icon: <FaBolt />, path: "/" },
    { label: "Settings", icon: <FaGamepad />, path: "/settings" },
  ];

  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : a.created_at ? new Date(a.created_at!).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : b.created_at ? new Date(b.created_at!).getTime() : 0;
    return dateB - dateA;
  });
  const handleSelect = (path: string) => {
    if (pathname !== path) router.push(path);
  
  };


  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    avatar_url: "",
    email: "",
    username: "",
    plan: "free",
    tokens_used: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data } = await supabase
          .from("users")
          .select(
            "name, avatar_url,username, email,plan,tokens_used,assistantTokens,userTokens"
          )
          .eq("id", session.user.id)
          .single();

        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <>
      <div
        className={`flex flex-col justify-between h-full fixed top-0 left-0 border-r border-gray-200 shadow-md bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[4vw]" : "w-[16vw]"
        }`}
      >
        <div>
          <div className="flex flex-row justify-between">
            <Image
            src="/glogo.png"
            alt="Logo"
            width={60}
            height={60}
            className={`${collapsed ? "justify-center" : ""} rounded-3xl`}
          />
          <button
            onClick={toggleCollapsed}
            className={` ${
              collapsed ? "absolute top-20 left-3.5" : "pr-3"
            } p-1.5 rounded-2xl text-gray-600 hover:text-[#2e147e] transition`}
            aria-label="Toggle Sidebar"
          >
            <FaWindowMaximize size={20} />
          </button>
          </div>


        
       

            {/* Menu */}
            <nav
              className={`flex gap-1 justify-evenly  ${
                collapsed ? "mt-43 flex-col gap-5" : "flex-row mb-3.5"
              }`}
            >
              {menuItems.map((item) => (
                <MenuItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={pathname === item.path}
                  onSelect={handleSelect}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          <div className="mx-3.5">
            


             <div className={`flex   ${collapsed?("mt-7 flex-col absolute top-25 left-2 gap-3"):("mt-2 flex-row gap-3")}`}>
                  <button onClick={() => createConversation("New chat")} className={`flex-1  hover:bg-gray-100  ${!collapsed?("rounded-md bg-black/10 px-3 justify-end"):("rounded-lg justify-center transition-all duration-200 py-2")} text-md text-gray-700 cursor-pointer font-semibold rounded  flex items-center  py-1 gap-4 `}>
                   {!collapsed && "New Chat"} <FaPlus color={"text-gray-700"} size={20} /> 
                  </button>
                  <button onClick={handleExport} className={`px-3 rounded cursor-pointer hover:bg-gray-100  ${!collapsed?("rounded-md py-1 bg-black/10 justify-end"):("rounded-lg justify-center transition-all duration-200 py-2 px-3")} text-md text-gray-700 flex items-center gap-4 font-semibold rounded `}>
                    {!collapsed && "Export"}<FaEnvelopeOpenText color={"text-gray-700"} size={20} /> 
                  </button>
                </div>
          </div>








        </div>
        <div>
          <p className={`text-black/40 text-sm font-semibold pb-1 px-2 ${collapsed?("hidden"):("")}`}>Chats</p>
          {!collapsed && (
          <div
            ref={containerRef}
            className="md:flex flex-col hidden gap-2 pl-2 px-2 h-[62vh] overflow-y-auto scrollbar-hide custom-scrollbar"
          >
            {sortedConversations.map((c) => (
              <ConversationBubble
                key={`desktop-${c.id}`}
                c={c}
                activeConversationId={activeConversationId}
                // IMPORTANT: when a bubble is clicked we call openConversation to update URL
                setActiveConversationId={() => openConversation(c.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <div
          className={`px-3  border-t-purple-300 border cursor-pointer flex flex-row gap-3 items-center ${collapsed ?"py-2":"py-1"}`}
          onClick={() => setModalOpen(true)}
        >
          <Image
            src={avatarUrl}
            alt="avatar"
            width={30}
            height={30}
            className="rounded-3xl border-[#2000c1] object-cover border-2"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p
                className="font-semibold text-sm truncate max-w-[9rem]"
                title={
                  session?.user?.user_metadata?.first_name ||
                  session?.user?.user_metadata?.name
                }
              >
                {session?.user?.user_metadata?.first_name ||
                  session?.user?.user_metadata?.name}
              </p>
              <h3 className="text-xs font-semibold text-[#2e147e]">
                {profile.plan === "pro" ? "Pro" : "Free"}
              </h3>
            </div>
          )}
        </div>
        </div>

             </div>
       
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Background Blur Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Centered Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="relative w-full max-w-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border border-gray-200/40 dark:border-gray-700/40 shadow-[0_0_50px_rgba(0,0,0,0.15)] rounded-3xl p-8">
              {/* Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>

              {/* Header Buttons (Settings / Signout) */}
              <div className="absolute top-4 left-4 flex gap-3">
                <button
                  onClick={() => setShowGlobalSettings(true)}
                  className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:scale-95 transition-transform"
                >
                  <SettingsIcon className="text-gray-600 dark:text-gray-300" />
                </button>

                <button
                  onClick={handleSignOut}
                  className={`p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:text-red-600 hover:scale-95 transition-all ${
                    collapsed
                      ? "right-3.5 bottom-[2vw] border-2 shadow-md border-gray-400"
                      : "right-4 top-[2.5vw] md:top-[2vh]"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-y-2 border-l-2 border-red-600"></div>
                    </div>
                  ) : (
                    <FaSignOutAlt className="size-5" />
                  )}
                </button>
              </div>

              {/* Profile Section */}
              <div className="flex flex-col items-center mt-10">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-[#2000c1] to-[#2e147e] shadow-xl mb-4">
                  <Image
                    src={profile.avatar_url || "/default-avatar.jpg"}
                    alt="avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#2000c1] to-[#2e147e] bg-clip-text text-transparent">
                  {profile.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  @{profile.username}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  {profile.email}
                </p>
              </div>

              {/* Stats Section */}
              <div className="mt-8 grid grid-cols-2 gap-6">
                {/* Plan Card */}
                <div className="bg-gradient-to-r from-[#2000c1]/10 to-[#2e147e]/10 dark:from-[#2000c1]/20 dark:to-[#2e147e]/20 rounded-2xl p-6 flex flex-col items-center shadow-inner border border-gray-200/40 dark:border-gray-700/40">
                  <p className="text-gray-500 dark:text-gray-400 uppercase text-sm mb-1">
                    Plan
                  </p>
                  <h3 className="text-xl font-semibold text-[#2e147e] dark:text-[#8b7cff]">
                    {profile.plan}
                  </h3>
                </div>

                {/* Token Usage Card */}
                <div className="bg-gradient-to-r from-[#2e147e]/10 to-[#2000c1]/10 dark:from-[#2e147e]/20 dark:to-[#2000c1]/20 rounded-2xl p-6 flex flex-col items-center shadow-inner border border-gray-200/40 dark:border-gray-700/40">
                  <p className="text-gray-500 dark:text-gray-400 uppercase text-sm mb-1">
                    Tokens Used
                  </p>
                  <h3 className="text-xl font-semibold text-[#2e147e] dark:text-[#8b7cff]">
                    {profile.tokens_used}
                  </h3>

                  <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
                      style={{
                        width: `${Math.min(profile.tokens_used, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
      <GlobalSettings
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
        initialTab="services"
      />
    </>
  );
}

/** Menu Item */
type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onSelect: (path: string) => void;
  collapsed: boolean;
};

function MenuItem({
  icon,
  path,
  isActive,
  onSelect,
  collapsed,
}: MenuItemProps) {
  return (
    <div
      onClick={() => onSelect(path)}
      className={`flex items-center mx-3  ${
        collapsed ? "justify-center" : "gap-4 bg-black/10"
      } p-2 rounded-lg  cursor-pointer transition-all duration-200 select-none ${
        isActive
          ? "bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white shadow-md "
          : "hover:bg-gray-100 text-black "
      }`}
      role="button"
      aria-current={isActive ? "page" : undefined}
    >
      <span className={`${isActive ? "text-white" : "text-gray-600"} ${collapsed ? "text-xl" : "text-lg"}`}>
        {icon}
      </span>
    
    </div>
  );
}




type ProfileForm = {
  name: string;
  avatar_url: string | null;
  email: string;
  username: string;
  plan: string;
  tokens_used: number;
};

