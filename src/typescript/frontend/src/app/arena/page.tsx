import { fetchCachedMeleeData } from "app/home/fetch-melee-data";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import FEATURE_FLAGS from "lib/feature-flags";
import { redirect } from "next/navigation";
import type { Metadata } from "next/types";
import { ROUTES } from "router/routes";

export const revalidate = 2;

export const metadata: Metadata = {
  title: "arena",
  description: "⚔️ Step into the Emojicoin Arena! Trade, battle and rise to glory.",
};

export default async function Arena() {
  if (!FEATURE_FLAGS.Arena) redirect(ROUTES.home);

  const { arenaInfo, market0, market1 } = await fetchCachedMeleeData();

  if (!arenaInfo || !market0 || !market1) redirect(ROUTES.home);

  return <ArenaClient arenaInfo={arenaInfo} market0={market0} market1={market1} />;
}
