import { REVALIDATION_TIME } from "lib/server-env";
import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import { type Metadata } from "next";
import { emoji } from "utils";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "launch",
  description: `Launch your own emojicoins using emojicoin.fun ${emoji("rocket")}`,
};

export default async function LaunchEmojicoinPage() {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <ClientLaunchEmojicoinPage geoblocked={geoblocked} />;
}
