import generateMetadataHelper from "lib/utils/generate-metadata-helper";
import { emoji } from "utils";

import ClientLaunchEmojicoinPage from "../../components/pages/launch-emojicoin/ClientLaunchEmojicoinPage";

export const dynamic = "force-static";

export const metadata = generateMetadataHelper({
  title: "launch",
  description: `launch your own emojicoins using emojicoin.fun ${emoji("party popper")}`,
});

export default async function LaunchEmojicoinPage() {
  return <ClientLaunchEmojicoinPage />;
}
