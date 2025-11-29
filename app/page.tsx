"use client";

import { useSession } from "@/lib/SessionContext";
import Loading from "@/components/Loading";


export default function HomePage() {
  const { loading } = useSession();

  if (loading) {
    return (
      <Loading/>
    );
  }

}
