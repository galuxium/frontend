"use client";

import { useSession } from "@/lib/SessionContext";
import { supabase } from "@/lib/supabase";
import { Conversation  } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import {  FaPlus, FaSignOutAlt, FaStore, FaWindowMaximize } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";
import ConversationBubble from "../AI/ConversationBubble";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { AnimatePresence, motion } from "framer-motion";
import AccountModal from "../AccountModal";
import { MdOutlineSubscriptions } from "react-icons/md";
import { FaBarsStaggered, FaLightbulb } from "react-icons/fa6";

import { CgClose } from "react-icons/cg";
import type { Dispatch, SetStateAction } from "react";
export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  mobileToogleCollapsed: boolean;
  setMobileToogleCollapsed: Dispatch<SetStateAction<boolean>>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export default function SidebarClient({
  collapsed,
  setCollapsed,
  mobileToogleCollapsed,
  setMobileToogleCollapsed,
  activeConversationId,
  setActiveConversationId,
}: SidebarProps) {
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id ?? null;
  const cid = params?.conversationId as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at!).getTime() -
      new Date(a.updated_at || a.created_at!).getTime()
  );

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const mobileToggleCollapsed = () => setMobileToogleCollapsed(!mobileToogleCollapsed);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/list?userId=${userId}`,
        { cache: "no-store" }
      );

      const j = await r.json();
      setConversations(j.data || []);

      if (cid) setActiveConversationId(cid);
    } catch (err) {
      console.error("Failed loading conversations", err);
    }
  }, [userId, cid, setActiveConversationId]);

  // Run once on mount or URL change
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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

          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
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

  const goToConversation = (id: string) => {
  const url = new URL(window.location.href);
  url.searchParams.delete("cid"); // remove stale previous chat
  router.push(`/chat/${id}`);     // navigate cleanly
  setActiveConversationId(id);
};

const openConversation = (id: string) => {
  goToConversation(id);
};

  const handleDelete = async (id: string) => {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: id }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Delete failed");

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (activeConversationId === id) {
        setActiveConversationId(null);
        router.replace("/", { scroll: false });
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };
  const model = ""
  
  const [openAccountModal, setOpenAccountModal] = useState(false);

const { createConversation } = useCreateConversation({
  model,
  setConversations,
  setActiveConversationId,
});
 
 const [loading, setLoading] = useState(false);
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    setLoading(false);
  };

  const [mobileSettingsModal,setMobileSettingsModal] = useState(false);
  return (
    <>
    <div 
    onClick={mobileToggleCollapsed}
    className="absolute left-4 top-3.5 block md:hidden lg:hidden hover:scale-95 duration-300 active:scale-85"><FaBarsStaggered size={20} /></div>
    <div
      className={`flex flex-col h-full fixed top-0 left-0 bg-surface transition-all duration-300 ease-in-out ${
        collapsed ? "md:w-15 w-0 justify-between md:flex hidden" : "md:w-60 w-0 md:block hidden"
      }`}
    >
     <div>
         <div className={`flex flex-row justify-between h-[10vh]`}>
        <Image
          src="/brand/logo.png"
          alt="Logo"
          width={60}
          height={60}
          className={`${
            collapsed ? "justify-center " : ""
          } rounded-3xl brightness-150`}
        />

        <button
          onClick={toggleCollapsed}
          className={`${
            collapsed
              ? "absolute left-3 top-3 hover:opacity-100 opacity-0 bg-surface"
              : "pr-3"
          } p-2 rounded-2xl text-secondary-text hover:text-primary transition duration-300 ease-in-out`}
          aria-label="Toggle Sidebar"
        >
          <FaWindowMaximize size={20} />
        </button>
      </div>

      <div className={`px-3 pb-2 justify-between flex flex-col   ${collapsed?"gap-4":"h-[18vh] gap-1 "}`}>
        <button
          onClick={() => createConversation("New Thread")}
          className={`w-full text-left truncate text-sm hover:bg-secondary/50  rounded-md ${
            !collapsed ? "px-3 py-2" : "px-2 py-2"
          }`}
        >
          {!collapsed && "New Thread" }{" "}
          {collapsed && <FaPlus color={"text-gray-700"} size={20} />}
        </button>
        <button
          className={`w-full text-left truncate text-sm hover:bg-secondary/50  rounded-md  ${
            !collapsed ? "px-3 py-2" : "px-2 py-2"
          }`}
        >
          {!collapsed && "Discover" }{" "}
          {collapsed && <FaLightbulb color={"text-gray-700"} size={20} />}
        </button>
        <button
          className={`w-full text-left truncate text-sm hover:bg-secondary/50  rounded-md  ${
            !collapsed ? "px-3 py-2" : "px-2 py-2"
          }`}
        >
          {!collapsed && "Store" }{" "}
          {collapsed && <FaStore color={"text-gray-700"} size={20} />}
        </button>
       {!collapsed && ( <p className="text-xs absolute text-accent/70 right-10 top-30.5 -z-10 truncate">Coming soon...</p>)}
       {!collapsed && ( <p className="text-xs absolute text-accent/70 right-10 top-40.5 -z-10 truncate">Coming soon...</p>)}
      </div>
      
     </div>
          
      
      {!collapsed && (
        <div className="h-[55vh]">
          <p className="text-secondary-text text-xs font-medium py-2 px-2">
            Threads
          </p>
          <div
            ref={containerRef}
            className="flex flex-col gap-2 pl-2 px-2 h-[50vh] overflow-y-auto scrollbar-hide custom-scrollbar overflow-x-hidden"
          >
            {sortedConversations.map((c) => (
              <ConversationBubble
                key={c.id}
                c={c}
                activeConversationId={activeConversationId}
                setActiveConversationId={() => openConversation(c.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
        <div
        className={`px-3 flex flex-col gap-3 py-3 ${collapsed?"":"h-[17vh]"}`}
        >
            <button className={`border py-2 text-sm ${collapsed?"rounded-xl flex flex-col items-center justify-center":"rounded-full"} bg-secondary/30 border-accent text-accent hover:scale-95 transition duration-300 hover:bg-secondary/50`}>
            {!collapsed && ("Upgrade")}
            {collapsed && (<MdOutlineSubscriptions size={25}/>)}
          </button>
          <div
       onClick={() => setOpenAccountModal(true)}
        className={` cursor-pointer hover:bg-secondary/40 rounded-md py-2 flex flex-row gap-3 items-center justify-center `}
      >
        <Image
          src={session?.user?.user_metadata?.avatar_url}
          alt="avatar"
          width={30}
          height={30}
          className="rounded-xl border-secondary object-cover border-2"
        />

        {!collapsed && (
          <div className="min-w-0">
            <p className="font-normal text-sm truncate max-w-36">
              {session?.user?.user_metadata?.first_name ||
                session?.user?.user_metadata?.name}
            </p>
            {/* <h3 className="text-xs font-medium text-secondary-text">
              {session?.user?.user_metadata?.plan === "pro" ? "Pro" : "Free"}
            </h3> */}
          </div>
        )}
      </div>
        </div>
      
      <AccountModal
  open={openAccountModal}
  onClose={() => setOpenAccountModal(false)}
  session={session}
/>

    </div>
    {/* ---- MOBILE DRAWER SIDEBAR ---- */}
<div
  className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
    mobileToogleCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  }`}
  onClick={() => setMobileToogleCollapsed(false)}
></div>

<div
  className={`fixed top-0 left-0 h-full w-64 bg-surface z-60 shadow-xl transition-transform duration-300 md:hidden ${
    mobileToogleCollapsed ? "translate-x-0" : "-translate-x-full"
  }`}
>
  {/* MOBILE SIDEBAR */}
  <div className="flex flex-col h-full p-2 gap-1">

    <div className="flex flex-row justify-between items-center  pr-2">
      <Image
      src="/brand/logo.png"
      width={60}
      height={60}
      alt="logo"
      className="rounded-2xl"
    />
    <button
      className=" rounded-lg hover:bg-secondary/30 hover:scale-95 duration-300 active:scale-85"
      onClick={() => setMobileToogleCollapsed(false)}
    >
      <FaBarsStaggered size={20} />
    </button>
    </div>

    

    <div className="">
      <button
      onClick={() => {
        createConversation("New Thread");
        setMobileToogleCollapsed(false);
      }}
      className="w-full text-left flex flex-row gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-sm"
    >
      
      <FaPlus color={"text-gray-700"} size={20} />
      New Thread
    </button>

    <button className="w-full text-left flex flex-row gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-sm">
      <FaLightbulb color={"text-gray-700"} size={20} />
      Discover
      
    </button>

    <button className="w-full text-left flex flex-row gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-sm">
      
      <FaStore color={"text-gray-700"} size={20} />
      Store
    </button>
    </div>

   
    <p className="text-xs text-secondary-text mt-5">Threads</p>

    <div className="flex flex-col gap-1 overflow-y-auto h-[50vh] custom-scrollbar">
      {sortedConversations.map((c) => (
        <ConversationBubble
          key={c.id}
          c={c}
          activeConversationId={activeConversationId}
          setActiveConversationId={() => {
            openConversation(c.id);
            setMobileToogleCollapsed(false);
          }}
          onDelete={handleDelete}
        />
      ))}
    </div>

    {/* Footer */}
    <button className="border py-2 text-xs mx-2 mt-3 rounded-full bg-secondary/30 border-accent text-accent hover:bg-secondary/50">
      Upgrade
    </button>

    <div
      onClick={() => {
        // addToast("Access advanced options from non mobile devices!", "success")
        setMobileToogleCollapsed(false);
        setMobileSettingsModal(true)
      }}
      className="cursor-pointer mt-2 mx-5 hover:bg-secondary/40 rounded-md flex items-center gap-3 p-2"
    >
      <Image
        src={session?.user?.user_metadata?.avatar_url}
        alt="avatar"
        width={35}
        height={35}
        className="rounded-xl border-2 border-secondary object-cover"
      />
      <p className="truncate text-sm text-center">
        {session?.user?.user_metadata?.first_name ||
          session?.user?.user_metadata?.name}
      </p>
      
    </div>
  </div>
</div>
          
             <AnimatePresence>
     {mobileSettingsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          aria-modal
          role="dialog"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.995 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.995 }}
            transition={{ type: "spring", damping: 20 }}
            className="p-4 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden"
          >
      
              <div className="flex flex-row items-center justify-between pb-2">
                <p className="text-sm">Settings</p>
              <CgClose 
              onClick={()=>setMobileSettingsModal(false)}
              className="hover:bg-secondary/60 rounded-md active:scale-95 duration-300"
              />
              </div>
              <div className="flex flex-row pt-3  justify-center gap-3 items-center  border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm ">Sign Out</p>
              <button
                  onClick={handleSignOut}
                  className={`p-2 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:text-red-600 hover:scale-95 transition-all`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-y-2 border-l-2 border-red-600"></div>
                    </div>
                  ) : (
                    <FaSignOutAlt className="size-4" />
                  )}
                </button>
              </div>

          
          </motion.div>
        </motion.div>
      
    
          )
} </AnimatePresence>
    </>
  );
}
