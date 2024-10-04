import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import { type Metadata } from "next";
import { emoji } from "utils";

export const revalidate = 1;
export const fetchCache = "default-cache";

export const metadata: Metadata = {
  title: "launch",
  description: `Launch your own emojicoins using emojicoin.fun ${emoji("party popper")}`,
};

export default async function LaunchEmojicoinPage() {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <ClientLaunchEmojicoinPage geoblocked={geoblocked} />;
}
