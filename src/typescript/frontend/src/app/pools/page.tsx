import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { REVALIDATION_TIME } from "lib/env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "auto";

export default function PoolsPage() {
  return <ClientPoolsPage />;
}
