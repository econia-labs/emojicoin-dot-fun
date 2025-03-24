import CultClientPage from "components/pages/cult/CultClientPage";
import { type Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "cult",
  description: `The emojicoin cult awaits...👹`,
};

export default function CultPage() {
  return <CultClientPage />;
}
