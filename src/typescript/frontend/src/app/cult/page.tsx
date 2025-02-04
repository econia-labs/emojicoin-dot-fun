import { type Metadata } from "next";
import CultClientPage from "components/pages/cult/CultClientPage";
import { VERCEL_TARGET_ENV } from "@sdk/const";
import LaunchingPage from "app/launching/page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export default function CultPage() {
  // Temporarily disable in production and show the Coming Soon page instead.
  VERCEL_TARGET_ENV === "production" ? <LaunchingPage /> : <CultClientPage />;
}
