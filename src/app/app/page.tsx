import type { Metadata } from "next";
import { ShellClient } from "@/components/life-os/shell-client";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppPage() {
  return <ShellClient />;
}
