import { fetchMarketStateByAddress, fetchMelee } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import { redirect } from "next/navigation";

export const revalidate = 2;

export default async function Arena() {
  let melee: Awaited<ReturnType<typeof fetchMelee>> = null;
  try {
    melee = await fetchMelee({});
  } catch (e) {
    console.warn(
      "Could not get melee data. This probably means that the backend is running an outdated version of the processor, without the arena processing. Please update."
    );
    redirect("/home");
  }

  if (!melee) {
    redirect("/home");
  }

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({ address: melee.arenaMelee.emojicoin0MarketAddress }),
    fetchMarketStateByAddress({ address: melee.arenaMelee.emojicoin1MarketAddress }),
  ]);

  return <ArenaClient melee={melee} market0={market0!} market1={market1!} />;
}
