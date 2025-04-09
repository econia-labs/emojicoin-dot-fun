import type { Metadata } from "next";
import { emoji } from "utils";

import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "launch",
  description: `Launch your own emojicoins using emojicoin.fun ${emoji("party popper")}`,
};

export default async function LaunchEmojicoinPage() {
  return <ClientLaunchEmojicoinPage />;
}
