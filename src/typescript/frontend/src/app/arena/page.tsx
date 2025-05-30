import { fetchCachedMeleeData } from "app/arena/fetch-melee-data";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import FEATURE_FLAGS from "lib/feature-flags";
import generateMetadataHelper from "lib/utils/generate-metadata-helper";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";

export const revalidate = 2;

export const metadata = generateMetadataHelper({
  title: "arena",
  description: "two emojicoins. one arena. 20 hours of emotional instability",
});

export default async function Arena() {
  if (!FEATURE_FLAGS.Arena) redirect(ROUTES.home);

  const { arenaInfo, market0, market1, rewardsRemaining, market0Delta, market1Delta } =
    await fetchCachedMeleeData();

  if (!arenaInfo || !market0 || !market1 || rewardsRemaining === null) redirect(ROUTES.home);

  return (
    <ArenaClient
      arenaInfo={arenaInfo}
      market0={market0}
      market1={market1}
      vaultBalance={rewardsRemaining}
      market0Delta={market0Delta ?? 0}
      market1Delta={market1Delta ?? 0}
    />
  );
}
