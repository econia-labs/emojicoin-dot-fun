import { type Metadata } from "next";
import BridgeClientPage from "../../components/pages/bridge/BridgeClientPage";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Bridge Assets",
  description: `Bridge assets into Aptos`,
};

export default function BridgePage() {
  return <BridgeClientPage />;
}
