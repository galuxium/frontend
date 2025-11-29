"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const name = params.get("Name") ?? "";
  const username = params.get("Username") ?? "";
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/auth/signup");
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setVerifying(true);
    setError("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data?.session) {
      setError("Invalid or expired code. Please try again.");
      setVerifying(false);
      return;
    }

    const user = data.session.user;
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name: name,
      username: username,
    });

    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
<div className="min-h-screen fixed inset-0 bg-surface/50 backdrop-blur-lg  p-4 flex items-center justify-center z-50  overflow-hidden">
 <div className="absolute -top-20 -left-32 w-[600px] h-[600px] bg-linear-to-br from-secondary to-accent opacity-20 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-60px] -right-10 w-[500px] h-[500px] bg-linear-to-tr from-primary to-accent opacity-20 blur-[100px] rounded-full z-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-background backdrop-blur-lg rounded-3xl shadow-2xl  w-70 md:w-full max-w-md px-5 py-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl brightness-200 md:text-3xl pb-1 font-bold text-button">
            Verify Your Email
          </h2>
          <p className="text-primary-text/50 text-sm mt-2 py-3">
            Enter the 6-digit code sent to{" "}
            <span className="text-primary-text/70 font-medium">{email}</span>
          </p>
        </div>

        <div className="flex justify-between gap-2 mb-8 px-0 md:px-5">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-8 md:w-12 h-10 md:h-14 text-2xl text-gray-800 text-center bg-white border border-gray-300 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-button shadow-sm"
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-xs text-center mb-4">{error}</div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying || otp.some((d) => d === "")}
          className="w-full py-3 text-md font-medium text-white rounded-xl bg-button hover:brightness-110 hover:scale-95 transition-all duration-300"
        >
          {verifying ? "Verifying..." : "Verify and Continue"}
        </button>

        <p className="mt-5 text-center text-xs font-semibold text-gray-500">
          Didn’t get the code?{" "}
          <span
            className="cursor-pointer font-semibold text-button brightness-200 hover:underline"
            onClick={handleOTPLogin}
          >
            Resend
          </span>
        </p>
      </motion.div>
    </div>
    </Suspense>
  );
}
