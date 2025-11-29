"use client";

import { Suspense } from "react";
import Loading from "@/components/Loading";
import VerifyEmailClient from "@/components/VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
