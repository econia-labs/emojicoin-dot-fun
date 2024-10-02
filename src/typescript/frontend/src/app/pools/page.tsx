import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";

export const revalidate = 10;
export const fetchCache = "default-cache";

export default async function PoolsPage() {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <ClientPoolsPage geoblocked={geoblocked} />;
}
