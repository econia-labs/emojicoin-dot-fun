import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { type Metadata } from "next";
import { emoji } from "utils";
import "../../app/launch.css"

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "launch",
  description: `Launch your own emojicoins using emojicoin.fun ${emoji("party popper")}`,
};

export default async function LaunchEmojicoinPage() {
  return <ClientLaunchEmojicoinPage />;
}
