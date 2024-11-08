import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import { type Metadata } from "next";
import { emoji } from "utils";
import { logFetch } from "lib/logging";

export const metadata: Metadata = {
  title: "launch",
  description: `Launch your own emojicoins using emojicoin.fun ${emoji("party popper")}`,
};

export default async function LaunchEmojicoinPage() {
  const geoblocked = await logFetch(isUserGeoblocked, { ip: headers().get("x-real-ip") });
  return <ClientLaunchEmojicoinPage geoblocked={geoblocked} />;
}
