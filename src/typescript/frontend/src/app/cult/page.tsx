import { type Metadata } from "next";
import CultClientPage from "components/pages/cult/CultClientPage";
import LaunchingPage from "app/launching/page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export default function CultPage() {
  // Add the ability to temporarily disable the page with a Coming Soon page.
  process.env.ENABLE_CULT_PAGE === "true" ? <CultClientPage/> : <LaunchingPage />;
}
