"use client";

import dynamic from "next/dynamic";

const ShellInternal = dynamic(() => import("./shell").then((m) => m.Shell), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md animate-pulse">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <p className="text-xs font-medium text-muted-foreground">Initializing Life OS...</p>
      </div>
    </div>
  ),
});

export function ShellClient() {
  return <ShellInternal />;
}
