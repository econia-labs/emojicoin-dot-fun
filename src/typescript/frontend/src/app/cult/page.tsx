import CultClientPage from "components/pages/cult/CultClientPage";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "cult",
  description: "we speak in tickers and tongues. welcome to the inner circle.",
};

export default function CultPage() {
  return <CultClientPage />;
}
