import CultClientPage from "components/pages/cult/CultClientPage";
import generateMetadataHelper from "lib/utils/generate-metadata-helper";

export const dynamic = "force-static";

export const metadata = generateMetadataHelper({
  title: "cult",
  description: "we speak in tickers and tongues. welcome to the inner circle.",
});

export default function CultPage() {
  return <CultClientPage />;
}
