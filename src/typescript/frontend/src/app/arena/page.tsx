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

  const { arena_info, market_0, market_1, rewards_remaining, market_0_delta, market_1_delta } =
    await fetchCachedMeleeData();

  if (!arena_info || !market_0 || !market_1 || rewards_remaining === null) redirect(ROUTES.home);

  return (
    <ArenaClient
      arenaInfo={arena_info}
      market0={market_0}
      market1={market_1}
      vaultBalance={rewards_remaining}
      market0Delta={market_0_delta ?? 0}
      market1Delta={market_1_delta ?? 0}
    />
  );
}
