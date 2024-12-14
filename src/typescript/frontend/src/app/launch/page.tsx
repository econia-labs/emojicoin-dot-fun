import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { fetchRandomSymbols } from "@/queries/launch";
import { type Metadata } from "next";
import { emoji } from "utils";

export const metadata: Metadata = {
  title: "launch",
  description: `Launch your own emojicoins using emojicoin.fun ${emoji("party popper")}`,
};

export default async function LaunchEmojicoinPage() {
  const randomSymbols = await fetchRandomSymbols({});
  return <ClientLaunchEmojicoinPage randomSymbols={randomSymbols} />;
}
