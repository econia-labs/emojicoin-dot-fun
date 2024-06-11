import { REVALIDATION_TIME } from "lib/server-env";
import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default function LaunchEmojicoinPage() {
  return <ClientLaunchEmojicoinPage />;
}
