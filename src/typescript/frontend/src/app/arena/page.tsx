import { type fetchArenaInfo, fetchMarketStateByAddress } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import { redirect } from "next/navigation";

export const revalidate = 2;

export default async function Arena() {
  let arenaInfo: Awaited<ReturnType<typeof fetchArenaInfo>> = null;
  try {
    // arenaInfo = await fetchArenaInfo({});
  } catch (e) {
    console.warn(
      "Could not get melee data. This probably means that the backend is running an outdated version of the processor, without the arena processing. Please update."
    );
    redirect("/home");
  }

  //if (!melee) {
  //  redirect("/home");
  //}

  arenaInfo = {
    arenaInfo: {
      duration: 120n * 1000n * 1000n,
      startTime: BigInt(new Date().getTime() * 1000 - 1000 * 1000 * 60),
      volume: 123n * 10n ** 8n,
      meleeId: 2n,
      aptLocked: 12n * 10n ** 8n,
      maxMatchAmount: 5n * 10n ** 8n,
      rewardsRemaining: 12345n * 10n ** 6n,
      maxMatchPercentage: 50n,
      emojicoin0MarketAddress: "0x43dcf02dcc0f3759d00486052585bf1694acf85c7e3e7c4b4770c5216d58eb67",
      emojicoin1MarketAddress: "0x43dcf02dcc0f3759d00486052585bf1694acf85c7e3e7c4b4770c5216d58eb67",
    },
  };

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({
      address: "0x43dcf02dcc0f3759d00486052585bf1694acf85c7e3e7c4b4770c5216d58eb67",
    }),
    fetchMarketStateByAddress({
      address: "0x43dcf02dcc0f3759d00486052585bf1694acf85c7e3e7c4b4770c5216d58eb67",
    }),
  ]);

  return <ArenaClient arenaInfo={arenaInfo} market0={market0!} market1={market1!} />;
}
