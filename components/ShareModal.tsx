"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Copy } from "lucide-react";

export default function ShareModal({
  open,
  onClose,
  conversationId,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}) {

  const shareUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/chat/${conversationId}`;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-[90%] max-w-md shadow-xl border border-neutral-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Share Conversation</h2>
              <button onClick={onClose}>
                <X className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* URL Box */}
            <div className="flex items-center bg-neutral-800 text-white px-3 py-2 rounded-md text-sm justify-between">
              <span className="truncate">{shareUrl}</span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-primary hover:opacity-90"
              >
                <Copy size={16} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full bg-primary text-white py-2 rounded-xl hover:bg-primary/90 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
