"use client";

import Image from "next/image";
import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-text fixed inset-0 z-50 flex items-center justify-center pl-40">
      <Image
        src="/loader.gif" 
        alt="Loading..."
        width={100}
        height={100}
        className="w-52 h-52 object-contain"
      />
    </div>
  );
};

export default Loading;
