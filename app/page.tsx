"use client";

import LandingPage from "@/components/LandingPage";
import { useSession } from "@/lib/SessionContext";
import Loading from "@/components/Loading";
import AiChat from "@/components/AiChat";

export default function HomePage() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <Loading/>
    );
  }

  return session ? <AiChat /> : <LandingPage />;
}
