import { fetchMarketStateByAddress, fetchMelee } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import { redirect } from "next/navigation";

export const revalidate = 2;

export default async function Arena() {
  const melee = await fetchMelee({});

  if (!melee) {
    redirect("/home");
  }

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({ address: melee.arenaMelee.emojicoin0MarketAddress }),
    fetchMarketStateByAddress({ address: melee.arenaMelee.emojicoin1MarketAddress }),
  ]);

  return <ArenaClient melee={melee} market0={market0!} market1={market1!} />;
}
