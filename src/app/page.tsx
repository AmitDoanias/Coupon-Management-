"use client";
import dynamic from "next/dynamic";

// Load the full app client-side only — avoids Supabase URL validation during SSR/build
const AppShell = dynamic(() => import("./app-shell"), { ssr: false });

export default function Page() {
  return <AppShell />;
}
