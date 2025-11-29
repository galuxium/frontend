"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import Image from "next/image";

// Function to generate a short username (5-10 chars)
function generateUsername(fullName: string, maxLength = 8) {
  const base = (fullName || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);

  const randomLength = Math.max(1, maxLength - base.length);
  const randomStr = Math.random().toString(36).substring(2, 2 + randomLength);

  return (base + randomStr).slice(0, maxLength);
}

// Main component
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth/login");
        return;
      }
      
      const user = session.user;

      // Retry up to 10 times to guarantee a unique username
      for (let attempt = 0; attempt < 10; attempt++) {
        const username = generateUsername(user.user_metadata.full_name || user.email);

        const { error } = await supabase
          .from("users")
          .upsert(
            {
              id: user.id,
              email: user.email,
              name:
                user.user_metadata.full_name ||
                user.user_metadata.name ||
                user.user_metadata.user_name ||
                "",
              username, // unique username
              avatar_url: user.user_metadata.avatar_url || null,
            },
          );

        if (!error) {
          console.log("User upserted with username:", username);
          break;
        }

        // If error is due to username conflict, retry
        if (error.code === "23505") {
          console.warn("Username conflict, regenerating...", username);
          continue;
        } else {
          console.error("Error inserting user:", error);
          break;
        }
      }

      router.replace("/");
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen fixed inset-0 bg-surface/50 backdrop-blur-lg  p-4 flex items-center justify-center z-50  overflow-hidden">
   
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-surface backdrop-blur-lg py-10 rounded-3xl shadow-2xl border border-border max-w-md w-70 md:w-full text-center"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full">
            <Image
              src="/brand/logo.png"
              width={200}
              height={200}
              alt="Galuxium"
              className="rounded-full"
            />
          </div>

          <h2 className="text-primary-text text-xl md:text-3xl font-semibold">
            Verifying your login
          </h2>

          <p className="text-gray-500 text-xs mt-5 px-5 md:px-0">
            Please wait while we verify your account and redirect you.
          </p>

          <div className="mt-10 mb-5 flex gap-3 justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className="w-5 h-5 brightness-150 bg-linear-to-br from-[#2200cd] to-[#2e147e] rounded-full"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
