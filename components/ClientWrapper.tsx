"use client";

import { useState } from "react";
import { useSession } from "@/lib/SessionContext";
import Sidebar from "@/components/Sidebar";

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const { session, loading } = useSession();
  const [collapsed, setCollapsed] = useState(true);

  if (loading) return null; 

  return (
    <div className="flex">
      {session && (
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      )}
      <main
        className={`transition-all duration-300 ease-in-out flex-1 ${
          session ? (collapsed ? "lg:ml-[4vw]" : "lg:ml-[16vw]") : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
