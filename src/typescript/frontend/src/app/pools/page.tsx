import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { REVALIDATION_TIME } from "lib/server-env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "auto";

export default function PoolsPage() {
  return <ClientPoolsPage />;
}
