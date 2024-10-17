import { REVALIDATION_TIME } from "lib/server-env";
import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import { fetchRandomNames } from "@/queries/launch";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-static";

export default async function LaunchEmojicoinPage() {
  const randomNames = await fetchRandomNames({});
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <ClientLaunchEmojicoinPage geoblocked={geoblocked} randomNames={randomNames} />;
}
