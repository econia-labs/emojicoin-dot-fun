import { fetchMarketStateByAddress, fetchMelee } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import { redirect } from "next/navigation";

export const revalidate = 2;

export default async function Arena() {
  let res: Awaited<ReturnType<typeof fetchMelee>> = null;
  try {
    res = await fetchMelee({});
  } catch (e) {
    console.warn(
      "Could not get melee data. This probably means that the backend is running an outdated version of the processor, without the arena processing. Please update."
    );
    redirect("/home");
  }

  if (!res) {
    redirect("/home");
  }

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({ address: res.melee.emojicoin0MarketAddress }),
    fetchMarketStateByAddress({ address: res.melee.emojicoin1MarketAddress }),
  ]);

  return <ArenaClient melee={res} market0={market0!} market1={market1!} />;
}
