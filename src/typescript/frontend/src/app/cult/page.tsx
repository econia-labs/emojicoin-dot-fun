import { type Metadata } from "next";
import CultClientPage from "components/pages/cult/CultClientPage";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export default function CultPage() {
  return <CultClientPage />;
}
