import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "arena",
  description: "⚔️ Step into the Emojicoin Arena! Trade, battle and rise to glory.",
};

export default async function ArenaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
