import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { REVALIDATION_TIME } from "lib/server-env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default function PoolsPage() {
  return <ClientPoolsPage />;
}
