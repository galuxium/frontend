"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  Globe,
  Mic,
  MicOff,
  File,
} from "lucide-react";
import IconSend from "./IconSend";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "";

type UploadedImage = {
  id: string;
  filename?: string;
  path?: string;
  url: string;
};

type ModelOption = {
  id: string;
  name: string;
  cli?: string;
  cliName?: string;
  available?: boolean;
  description?:string
};

type SpeechRecognitionCtor = new () => {
  start(): void;
  stop(): void;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SimpleSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Error | Event) => void) | null;
};

interface WindowWithSpeech {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

// Very small event type that matches what browsers actually give
interface SimpleSpeechRecognitionEvent {
  results: {
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
      length: number;
    };
    length: number;
  };
}
type SRResult = {
  isFinal: boolean;
  0: { transcript: string };
} & SpeechRecognitionResult;

export default function SearchBar({
  onSend,
  disabled = false,
  scrollToBottom = () => {},
  autoScroll = true,
  projectId,
  models = [], // controlled list from parent
  selectedModel = "",
  onModelChange,
  mode = "chat",
}: {
onSend: (text: string, images?: UploadedImage[]) => void;
  disabled?: boolean;
  scrollToBottom?: () => void;
  autoScroll?: boolean;
  projectId?: string | null;
  models?: ModelOption[]; // <- parent passes available models
  selectedModel?: string; // <- current selection from parent
  onModelChange?: (id: string) => void; // <- notify parent of selection
  mode?: "act" | "chat";
  onModeChange?: (m: "act" | "chat") => void;
}) {
  // core state
  const [text, setText] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
const chooseModel = (id: string) => {
    onModelChange?.(id);
    setOpen(false);
    textareaRef.current?.focus();
  };
    const [open, setOpen] = useState<boolean>(false);
   
  


  // autosize textarea
  const adjustTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "40px";
    const height = Math.min(ta.scrollHeight, 220);
    ta.style.height = `${height}px`;
  }, []);
  useEffect(() => adjustTextarea(), [text, adjustTextarea]);

  // upload helper (falls back to local preview)
  const uploadFile = useCallback(
    async (file: File) => {
      if (!projectId || !API_BASE) {
        const url = URL.createObjectURL(file);
        const fresh: UploadedImage = {
          id: crypto.randomUUID(),
          filename: file.name,
          url,
        };
        setUploadedImages((p) => [...p, fresh]);
        return fresh;
      }

      setIsUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const resp = await fetch(`${API_BASE}/api/assets/${projectId}/upload`, {
          method: "POST",
          body: form,
        });
        if (!resp.ok) {
          const txt = await resp.text();
          console.error("Upload failed:", resp.status, txt);
          throw new Error("Upload failed");
        }
        const j = await resp.json();
        const previewUrl = URL.createObjectURL(file);
        const uploaded: UploadedImage = {
          id: crypto.randomUUID(),
          filename: j.filename || file.name,
          path: j.absolute_path || j.path || undefined,
          url: previewUrl,
        };
        setUploadedImages((p) => [...p, uploaded]);
        return uploaded;
      } catch (e) {
        console.error(e);
        const url = URL.createObjectURL(file);
        const fallback: UploadedImage = {
          id: crypto.randomUUID(),
          filename: file.name,
          url,
        };
        setUploadedImages((p) => [...p, fallback]);
        return fallback;
      } finally {
        setIsUploading(false);
      }
    },
    [projectId]
  );

  // Accepts a FileList or array-like and uploads all images (sequentially to preserve order)
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!files || files.length === 0) return;
      const arr = Array.from(files);
      const images = arr.filter((f) => f.type.startsWith("image/"));
      for (const f of images) {
        await uploadFile(f);
      }
    },
    [uploadFile]
  );

  const removeImage = (id: string) => {
    setUploadedImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
  };



  // paste support (images)
  useEffect(() => {
    const onPaste = (ev: ClipboardEvent) => {
      try {
        const items = ev.clipboardData?.items;
        if (!items) return;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type?.startsWith("image/")) {
            const f = item.getAsFile();
            if (f) files.push(f);
          }
        }
        if (files.length) {
          ev.preventDefault();
          void handleFiles(files);
        }
      } catch (e) {
        console.error("Paste handling failed", e);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  // drag-drop handlers
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) e.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setIsDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length) void handleFiles(files);
  };

  // keyboard submit: Enter = send, Shift+Enter newline
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(
    null
  );
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const startListening = () => {
    const win = window as unknown as WindowWithSpeech;
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const instance = new Rec();
      instance.interimResults = true;
      instance.lang = "en-US";
      instance.onresult = (ev: SimpleSpeechRecognitionEvent) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < ev.results.length; i++) {
          const res = ev.results[i] as SRResult;
          if (res.isFinal) final += res[0].transcript;
          else interim += res[0].transcript;
        }
        if (final) {
          setText((prev) => (prev ? `${prev} ${final}` : final));
        }
        setInterimTranscript(interim);
      };
      instance.onend = () => {
        setListening(false);
        setInterimTranscript("");
      };
      instance.onerror = (e: unknown) => {
        console.error("SpeechRecognition error", e);
        setListening(false);
      };
      recognitionRef.current = instance;
      instance.start();
      setListening(true);
    } catch (e) {
      console.error("startListening failed", e);
      alert("Unable to start microphone.");
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    } finally {
      setListening(false);
      setInterimTranscript("");
    }
  };

  // submit
  const handleSubmit = async () => {
    if (disabled || isUploading) return;
    const txt = text.trim();
    if (!txt && uploadedImages.length === 0) return;
    try {
      await Promise.resolve(
        onSend(txt, uploadedImages.length ? uploadedImages : undefined)
      );
    } catch (err) {
      console.error("onSend threw:", err);
    }
    // reset
    setText("");
    uploadedImages.forEach((u) => URL.revokeObjectURL(u.url));
    setUploadedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.focus();
    }
    if (!autoScroll) scrollToBottom();
  };





  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="w-70 md:w-3xl mx-auto"
    >
      <div className="rounded-xl  bg-surface  shadow-lg p-3">

     
            
        <div
          className={`relative ${
            isDragOver ? "ring-2 ring-blue-400/60 rounded-xl" : ""
          }`}
        >
          <div className="flex items-start gap-3">
           

            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask anything..."
                disabled={disabled}
                className="w-full resize-none bg-surface p-1 text-md placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none min-h-[5vh] max-h-[40vh] overflow-auto custom-scrollbar"
                style={{ height: 40 }}
              />

              {/* interim transcript */}
              {listening && interimTranscript && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                  Transcribing: {interimTranscript}
                </div>
              )}

              {/* image previews (Next/Image) */}
              {uploadedImages.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative w-24 h-24 rounded-md overflow-hidden border"
                    >
                      <Image
                        src={img.url}
                        alt={img.filename || "upload"}
                        width={96}
                        height={96}
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-white/80 text-black rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              
            </div>
          </div>

          {/* drag overlay */}
          {isDragOver && (
            <div className="pointer-events-none absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl flex items-center justify-center z-10 border-2 border-dashed border-blue-400">
              <div className="text-center">
                <div className="text-2xl mb-2">📷</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Drop images to upload
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="text-gray-500 flex flex-row items-center gap-2">
            <button
              type="button"
              className={`px-2 py-1 rounded-md ${
                mode === "chat"
                  ? "bg-gray-200 dark:bg-gray-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <Globe className="size-5 text-primary-text" />
            </button>
          </div>

          <div className="text-gray-500 flex flex-row items-center gap-3">
           
          


            {open && (
              <div className="absolute  text-xs md:text-1.5xl md:w-[15vw] mb-55 rounded-xl shadow-lg overflow-hidden bg-linear-to-r from-[#2000c1] to-[#2e147e] textlinear10">
                {models.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No models available</div>
                ) : (
                  models.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => chooseModel(m.id)}
                      className={`px-4 py-2 cursor-pointer hover:bg-button/80 transition-all duration-200 ${selectedModel === m.id ? "bg-white/20" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                    <p className="font-medium">{m.name}</p>{" "}
                   
                    <p className="text-[9px] font-normal">{m.description}</p>
                        </div>
                        <div className="text-xs text-gray-400">{m.available === false ? "Unavailable" : ""}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
         
            {/* <button
              type="button"
              onClick={() => console.log("Dummy: Browse web")}
              className="px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900"
            >
              <Paperclip className="size-5" />
            </button>
            <label
              title="Upload images"
              className={`p-1 rounded-md cursor-pointer ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="hidden"
                disabled={disabled || isUploading}
              />
              <ImageIcon className="size-5" />
            </label> */}

            {/* microphone */}
            <button
              type="button"
              onClick={() => (listening ? stopListening() : startListening())}
              title={listening ? "Stop recording" : "Record voice"}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
                listening
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:scale-105"
              }`}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4"/>}
            </button>
            <button
            type="submit"
            disabled={
              disabled ||
              isUploading ||
              (!text.trim() && uploadedImages.length === 0)
            }
            className="flex items-center justify-center w-8 h-7 rounded-md bg-button text-white hover:scale-95 transition disabled:opacity-50"
            title="Send"
          >
            <IconSend/>
          </button>
          </div>
          
        </div>
      </div>
    </form>
  );
}
