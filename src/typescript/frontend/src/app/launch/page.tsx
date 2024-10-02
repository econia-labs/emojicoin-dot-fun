import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";

export const fetchCache = "default-cache";

export default async function LaunchEmojicoinPage() {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <ClientLaunchEmojicoinPage geoblocked={geoblocked} />;
}
