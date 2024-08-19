import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { REVALIDATION_TIME } from "lib/server-env";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function PoolsPage() {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <ClientPoolsPage geoblocked={geoblocked} />;
}
