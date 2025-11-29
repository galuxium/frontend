"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  X,
  Sun,
  Moon,
  Globe,
  ArrowUpRight,
  Linkedin,
  MessageSquare,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { FaSignOutAlt } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/lib/types";

/**
 * AdvancedSettingsModal
 *
 * Drop-in: components/Modals/AdvancedSettingsModal.tsx
 *
 * Replace stubbed network functions with your real backend handlers.
 */

type ModelOption = {
  id: string;
  name: string;
  provider?: string; // "openai" | "google" | "perplexity" etc
  description?: string;
  recommended?: boolean;
};

type SettingsSchema = {
  // Account / appearance
  theme: "light" | "dark" | "system" | string;
  // Model
  modelId?: string | null;
  temperature: number;
  maxTokens: number;
  topP: number;
  // Behavior
  responseStyle: "balanced" | "creative" | "concise" | "analytical" |string;
  systemPrompt?: string;
  // Features
  enableWebBrowsing: boolean;
  enablePlugins: boolean;
  enableToolExecution: boolean;
  // Safety & privacy
  anonymizeLogs: boolean;
  shareConversationsByDefault: boolean;
  allowDataUse: boolean;
  // Integrations (toggles)
  integrationPerplexity: boolean;
  integrationGemini: boolean;
  integrationCustomApiKey?: string | null;
  // Billing & usage (readonly here)
  showUsageDashboard: boolean;
  // Dev & advanced
  enableStreaming: boolean;
  developerMode: boolean;
};

const DEFAULT_SETTINGS: SettingsSchema = {
  theme: "system",
  modelId: null,
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1,
  responseStyle: "balanced",
  systemPrompt: "",
  enableWebBrowsing: false,
  enablePlugins: false,
  enableToolExecution: false,
  anonymizeLogs: true,
  shareConversationsByDefault: false,
  allowDataUse: false,
  integrationPerplexity: false,
  integrationGemini: false,
  integrationCustomApiKey: null,
  showUsageDashboard: true,
  enableStreaming: true,
  developerMode: false,
};

/* ------------------------------ STUBS ------------------------------ */
/* Replace these with real network calls */
async function loadSettingsFromServer(): Promise<Partial<SettingsSchema> | null> {
  // fetch('/api/settings')...
  return null;
}

export default function AdvancedSettingsModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  onSignOut?: () => void;
}) {
  const user = session?.user?.user_metadata ?? null;

  // UI state
  const [activeTab, setActiveTab] = useState<
    | "account"
    | "appearance"
    | "model"
    | "features"
    | "privacy"
    | "integrations"
    | "billing"
    | "brandsocials"
    | "advanced"
  >("account");
  const [loading, setLoading] = useState(false);

  // settings state (local editable copy)
  const [settings, setSettings] = useState<SettingsSchema>(() => ({
    ...DEFAULT_SETTINGS,
  }));

  // available model options — replace with dynamic fetch if desired
  const modelOptions: ModelOption[] = useMemo(
    () => [
      { id: "gpt-4o", name: "GPT-4o (OpenAI)", provider: "openai", recommended: true },
      { id: "gpt-3.5", name: "GPT-3.5 (OpenAI)", provider: "openai" },
      { id: "gemini-pro", name: "Gemini Pro (Google)", provider: "google" },
      { id: "perplexity-edu", name: "Perplexity Labs", provider: "perplexity" },
      { id: "local-llama", name: "Local LLaMA/Nemo", provider: "local" },
    ],
    []
  );
  const userId = session?.user?.id;
    
  const [profile,setProfile]=useState<ProfileForm>()
  useEffect(() => {
    
     (async () => {
      
       try {
         const res = await fetch(
           `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/details`,{
             method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
        }),
           }
         );
         const json = await res.json();
         
         setProfile(json?.data[0] ?? [])
       } catch (err) {
         console.warn("Failed to fetch models", err);
       }
     })();
   }, [userId]);

  useEffect(() => {
    if (!open) return;
    // load settings from server if present
    (async () => {
      setLoading(true);
      try {
        const server = await loadSettingsFromServer();
        if (server) setSettings((s) => ({ ...s, ...server }));
      } catch (e) {
        console.warn("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  /* ------------------ handlers ------------------ */

  const setPartial = (patch: Partial<SettingsSchema>) =>
    setSettings((s) => ({ ...s, ...patch }));

 


const router = useRouter();


  /* ------------------ small UI helpers ------------------ */

  const inputClass =
    "w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-md text-sm";
const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    setLoading(false);
  };
  return (
    <AnimatePresence>
      {open && (
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
            className="w-full max-w-6xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden grid grid-cols-4"
          >
            {/* Left nav */}
            <nav className="col-span-1 bg-neutral-50 dark:bg-neutral-900 p-4 border-r border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={user?.avatar_url ?? "/brand/logo.png"}
                  alt="avatar"
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {user?.first_name ?? user?.name ?? "User"}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {session?.user.email}
                  </div>
                </div>
              </div>

              <ul className="space-y-1 text-sm">
                <li>
                  <button
                    onClick={() => setActiveTab("account")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "account"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Account
                  </button>
                </li>
                {/* <li>
                  <button
                    onClick={() => setActiveTab("appearance")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "appearance"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Appearance
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("model")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "model"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Model & AI
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("features")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "features"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Features
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => setActiveTab("integrations")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "integrations"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Integrations
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => setActiveTab("privacy")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "privacy"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Privacy & Safety
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => setActiveTab("billing")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "billing"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Billing & Usage
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => setActiveTab("brandsocials")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "brandsocials"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Brand Socials
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => setActiveTab("advanced")}
                    className={`w-full text-left p-2 rounded-md ${
                      activeTab === "advanced"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    Advanced
                  </button>
                </li> */}
              </ul>

              <div className="mt-6 flex flex-row justify-between items-center px-5 border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2">
                Sign Out
              <button
                  onClick={handleSignOut}
                  className={`p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:text-red-600 hover:scale-95 transition-all`}
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
            </nav>

            {/* Right content: 3 cols wide */}
            <div className="col-span-3 p-6 overflow-y-auto max-h-[80vh]">
              {/* header area with Save / Reset / Close */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Settings</h3>
                  <p className="text-sm text-neutral-500">
                    Configure your account.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* <button
                    onClick={handleReset}
                    className="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm hover:bg-neutral-200"
                    title="Restore defaults"
                  >
                    <RefreshCcw size={16} className="inline-block mr-2" />
                    Reset
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 flex items-center gap-2"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save"}
                  </button> */}

                  <button
                    onClick={onClose}
                    className="px-2 py-1 hover:scale-95 active:scale-85 hover:bg-neutral-800 transition duration-300 rounded-md border border-neutral-200 dark:border-neutral-800 text-sm"
                    title="Close"
                  >
                    <X size={30} />
                  </button>
                </div>
              </div>

              {/* content per tab */}
              {activeTab === "account" && (
                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Account</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Name
                      </label>
                      <input
                        className={inputClass}
                        value={user?.first_name ?? user?.name ?? ""}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Email
                      </label>
                      <input
                        className={inputClass}
                        value={session?.user.email ?? ""}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Tokens consumed
                      </label>
                      <input
                        className={inputClass}
                        value={profile?.tokens_used ?? ""}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Username
                      </label>
                      <input
                        className={inputClass}
                        value={profile?.username ?? ""}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Plan
                      </label>
                      <input
                        className={inputClass}
                        value={profile?.plan ?? ""}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* <button
                      onClick={() => setSettings((s) => ({ ...s }))}
                      className="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800"
                    >
                      Manage Account
                    </button> */}

                   

                    <div className="ml-auto text-sm text-neutral-500">
                      Member since: <span className="font-medium">{session?.user.created_at}</span>
                    </div>
                  </div>

                 
                </section>
              )}

              {activeTab === "appearance" && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium">Appearance</h4>
                    <div className="text-sm text-neutral-500">Theme & layout</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">
                        Theme
                      </label>
                      <select
                        value={settings.theme}
                        onChange={(e) =>
                          setPartial({ theme: e.target.value })
                        }
                        className={inputClass}
                      >
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sun />
                      <Moon />
                    </div>

                    <div className="col-span-3 grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800">
                        <p className="font-medium">Compact</p>
                        <p className="text-xs text-neutral-500">Smaller gaps</p>
                      </div>
                      <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800">
                        <p className="font-medium">Comfortable</p>
                        <p className="text-xs text-neutral-500">Default</p>
                      </div>
                      <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800">
                        <p className="font-medium">Large</p>
                        <p className="text-xs text-neutral-500">Bigger text</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "model" && (
                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Model & AI</h4>
                  <p className="text-sm text-neutral-500">
                    Choose which model to use, tune parameters, and set defaults.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Model
                      </label>
                      <select
                        className={inputClass}
                        value={settings.modelId ?? ""}
                        onChange={(e) =>
                          setPartial({
                            modelId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">— Default —</option>
                        {modelOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.recommended ? " · recommended" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Response style
                      </label>
                      <select
                        className={inputClass}
                        value={settings.responseStyle}
                        onChange={(e) =>
                          setPartial({ responseStyle: e.target.value  })
                        }
                      >
                        <option value="balanced">Balanced</option>
                        <option value="creative">Creative</option>
                        <option value="concise">Concise</option>
                        <option value="analytical">Analytical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Temperature ({settings.temperature})
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings.temperature}
                        onChange={(e) =>
                          setPartial({ temperature: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Max tokens ({settings.maxTokens})
                      </label>
                      <input
                        type="range"
                        min={64}
                        max={8192}
                        step={1}
                        value={settings.maxTokens}
                        onChange={(e) =>
                          setPartial({ maxTokens: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">
                        System prompt (default instructions)
                      </label>
                      <textarea
                        className={inputClass + " h-28"}
                        value={settings.systemPrompt ?? ""}
                        onChange={(e) =>
                          setPartial({ systemPrompt: e.target.value })
                        }
                        placeholder="You are a helpful assistant..."
                      />
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "features" && (
                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Features</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.enableWebBrowsing}
                        onChange={(e) =>
                          setPartial({ enableWebBrowsing: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Web browsing</div>
                        <div className="text-xs text-neutral-500">
                          Allow model to use live web results
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.enablePlugins}
                        onChange={(e) =>
                          setPartial({ enablePlugins: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Plugins & extensions</div>
                        <div className="text-xs text-neutral-500">
                          Enable third-party plugins
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.enableToolExecution}
                        onChange={(e) =>
                          setPartial({ enableToolExecution: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Tool execution</div>
                        <div className="text-xs text-neutral-500">
                          Allow running code snippets / utilities
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.enableStreaming}
                        onChange={(e) =>
                          setPartial({ enableStreaming: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Streaming responses</div>
                        <div className="text-xs text-neutral-500">
                          Stream tokens as the model generates them
                        </div>
                      </div>
                    </label>
                  </div>
                </section>
              )}

              {activeTab === "integrations" && (
                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Integrations</h4>
                  <p className="text-sm text-neutral-500">
                    Connect to external providers and APIs.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.integrationPerplexity}
                        onChange={(e) =>
                          setPartial({ integrationPerplexity: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Perplexity</div>
                        <div className="text-xs text-neutral-500">
                          Use Perplexity search augmentation
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.integrationGemini}
                        onChange={(e) =>
                          setPartial({ integrationGemini: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Gemini</div>
                        <div className="text-xs text-neutral-500">
                          Use Google Gemini as a model provider
                        </div>
                      </div>
                    </label>

                    <div className="col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">
                        Custom API Key
                      </label>
                      <input
                        className={inputClass}
                        placeholder="sk-..."
                        value={settings.integrationCustomApiKey ?? ""}
                        onChange={(e) =>
                          setPartial({ integrationCustomApiKey: e.target.value })
                        }
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Provide an API key to use a custom provider.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "privacy" && (
                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Privacy & Safety</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.anonymizeLogs}
                        onChange={(e) =>
                          setPartial({ anonymizeLogs: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Anonymize logs</div>
                        <div className="text-xs text-neutral-500">
                          Remove personally identifying info from logs
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.allowDataUse}
                        onChange={(e) =>
                          setPartial({ allowDataUse: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Allow data use</div>
                        <div className="text-xs text-neutral-500">
                          Allow your data to be used to improve models
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.shareConversationsByDefault}
                        onChange={(e) =>
                          setPartial({ shareConversationsByDefault: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Share by default</div>
                        <div className="text-xs text-neutral-500">
                          When enabled, newly created conversations are shareable by default
                        </div>
                      </div>
                    </label>
                  </div>
                </section>
              )}


              {activeTab === "brandsocials" && (
                <section>
                <h3 className="text-sm font-semibold mb-3 text-neutral-400">
                  GALUXIUM — SOCIALS
                </h3>

                <div className="bg-linear-to-br from-neutral-800 to-neutral-900 border border-neutral-700 rounded-2xl p-5 space-y-4 shadow-inner">

                  <p className="text-sm text-neutral-300">
                    Follow <span className="font-semibold text-white">@galuxium</span> across the internet.
                  </p>

                  <div className="flex flex-col gap-3">

                    <Link
                      href="https://discord.gg/KXdk57w9JP"
                      target="_blank"
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <MessageSquare size={18} /> Discord
                      </div>
                      <ArrowUpRight size={18} />
                    </Link>

                    <Link
                      href="https://www.linkedin.com/company/galuxium"
                      target="_blank"
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <Linkedin size={18} /> LinkedIn
                      </div>
                      <ArrowUpRight size={18} />
                    </Link>

                    <Link
                      href="https://x.com/galuxium"
                      target="_blank"
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <Globe size={18} /> Twitter / X (@galuxium)
                      </div>
                      <ArrowUpRight size={18} />
                    </Link>

                  </div>
                </div>
              </section>
              )}

              {activeTab === "advanced" && (
                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Advanced</h4>
                  <p className="text-sm text-neutral-500">
                    Developer and experimental options. Use with caution.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.developerMode}
                        onChange={(e) =>
                          setPartial({ developerMode: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Developer mode</div>
                        <div className="text-xs text-neutral-500">
                          Extra logs & dev tools
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                      <input
                        type="checkbox"
                        checked={settings.enablePlugins}
                        onChange={(e) =>
                          setPartial({ enablePlugins: e.target.checked })
                        }
                      />
                      <div>
                        <div className="font-medium">Enable experimental plugins</div>
                        <div className="text-xs text-neutral-500">
                          Experimental — may cause instability
                        </div>
                      </div>
                    </label>

                    <div className="col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">
                        Custom headers (for advanced API usage)
                      </label>
                      <textarea className={inputClass + " h-24"} placeholder={`{ "x-api-key": "..." }`} />
                      <p className="text-xs text-neutral-500 mt-1">Raw JSON headers passed to provider.</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

