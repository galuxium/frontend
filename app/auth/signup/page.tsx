"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaArrowLeft, FaGithub, FaGoogle, FaUserAlt } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");

    const { email, name, username } = form;

    if (!email || !name || !username) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        data: { name: name, username: username },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(email)}&nameame=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}`
      );
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* 🌤 Premium Light Gradients */}
      <div className="absolute -top-20 -left-32 w-[600px] h-[600px] bg-linear-to-br from-secondary to-accent opacity-20 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-60px] -right-10 w-[500px] h-[500px] bg-linear-to-tr from-primary to-accent opacity-20 blur-[100px] rounded-full z-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-background backdrop-blur-lg rounded-3xl shadow-2xl  w-70 md:w-full max-w-md"
      >
        <div className="relative z-10 p-7">
          <Link
            href="/"
            className="absolute left-3 top-3 p-2 rounded-xl  hover:bg-secondary/40 active:scale-95 duration-200 transition shadow"
          >
            <FaArrowLeft className="text-primary-text size-6" />
          </Link>

          <div className="flex justify-center mb-4">
            <div className="p-3 md:p-4 bg-linear-to-br from-[#7B61FF] to-[#2e147e] rounded-full shadow-xl">
              <FaUserAlt className="text-xl md:text-2xl text-white" />
            </div>
          </div>

          <h2 className="text-xl md:text-3xl font-semibold text-center text-primary-text mb-2">
            Create your{" "}
            <span className=" text-xl md:text-3xl md:bg-clip-text md:text-transparent  font-semibold  text-primary-text md:bg-linear-to-r from-[#7B61FF] to-[#2e147e]">
              Account
            </span>
             
          </h2>

          <p className="text-center text-gray-500 text-xs font-medium md:text-sm mb-6">
            Welcome! Please fill in the details to get started.
          </p>

                <div className="flex md:flex-row flex-col gap-3 mb-4">
            <button
              onClick={() => handleOAuth("google")}
              className="flex-1 py-2 border border-secondary/70 rounded-lg flex justify-center items-center gap-2 text-sm font-medium bg-secondary/30 hover:bg-secondary/10 transition"
            >
              <FaGoogle /> Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              className="flex-1 py-2 border border-secondary/70 rounded-lg flex justify-center items-center gap-2 text-sm font-medium bg-secondary/30 hover:bg-secondary/10 transition"
            >
              <FaGithub /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[55%_41%] gap-3 mb-3">
            <input
              placeholder="Name"
              className="px-3 py-2 border placeholder-secondary/80 rounded-lg bg-white/95 text-sm text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <input
              placeholder="Username"
              className="px-3 py-2 border placeholder-secondary/80 rounded-lg bg-white/95 text-sm text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
          </div>

          <input
            placeholder="Email address"
            type="email"
            className="w-full px-3 py-2 border placeholder-secondary/80 rounded-lg bg-white/95 text-sm mb-3 text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 text-center mb-3">{error}</p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="mt-4 w-full py-2 md:py-3 text-md md:text-lg font-medium md:font-bold text-white rounded-xl bg-linear-to-br from-[#7B61FF] to-[#2e147e] hover:brightness-110 hover:scale-97 transition-all duration-500"
          >
            {loading ? "Sending OTP..." : "Continue"}
          </button>

                    <p className="mt-5 text-xs md:text-sm font-semibold text-center text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-600  font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        
      </motion.div>
    </div>
  );
}
