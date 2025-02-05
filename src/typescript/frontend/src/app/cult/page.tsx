import { type Metadata } from "next";
import CultClientPage from "components/pages/cult/CultClientPage";
import LaunchingPage from "app/launching/page";
import { VERCEL_TARGET_ENV } from "@sdk/const";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export default function CultPage() {
  // Temporarily disable the page in non-development/non-preview modes and show the Launching Soon page instead.
  return VERCEL_TARGET_ENV === "development" || VERCEL_TARGET_ENV === "preview" ? (
    <CultClientPage />
  ) : (
    <LaunchingPage />
  );
}
