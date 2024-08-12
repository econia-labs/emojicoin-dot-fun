import { REVALIDATION_TIME } from "lib/server-env";
import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { isBanned } from "utils/geolocation";
import { headers } from "next/headers";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-static";

export default async function LaunchEmojicoinPage() {
  const geoblocked = await isBanned(headers().get("x-real-ip"));
  return <ClientLaunchEmojicoinPage geoblocked={geoblocked} />;
}
