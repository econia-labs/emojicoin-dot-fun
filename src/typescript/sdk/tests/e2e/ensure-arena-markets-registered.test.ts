import { ARENA_MODULE_ADDRESS, EmojicoinArena, getAptosClient } from "../../src";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import {
  fetchArenaMeleeView,
  fetchArenaRegistryView,
  fetchMeleeEmojiData,
} from "../../src/markets/arena-utils";

/**
 * Because this test checks the details of the very first arena it must run separately from other
 * arena tests.
 */
describe("ensures the two arena markets and the arena module are on-chain as expected", () => {
  const emojicoin = new EmojicoinClient();
  const aptos = getAptosClient();
  it("verifies that the arena module is already published on-chain", async () => {
    const res = await aptos.getAccountModule({
      accountAddress: ARENA_MODULE_ADDRESS,
      moduleName: EmojicoinArena.Enter.prototype.moduleName ?? "emojicoin_arena",
    });
    expect(res.bytecode).toBeTruthy();
  });

  it("verifies that both arena markets in the `deployer` service are registered on-chain", async () => {
    await emojicoin.view.marketExists(["💧"]).then((exists) => expect(exists).toBe(true));
    await emojicoin.view.marketExists(["🔥"]).then((exists) => expect(exists).toBe(true));
  });

  it("verifies an arena has already started with a duration of 1 microsecond", async () => {
    const water = emojicoin.utils.getEmojicoinInfo(["💧"]);
    const fire = emojicoin.utils.getEmojicoinInfo(["🔥"]);
    await fetchArenaMeleeView(1n).then((res) => {
      expect(res.emojicoin0MarketAddress).toEqual(water.marketAddress.toString());
      expect(res.emojicoin1MarketAddress).toEqual(fire.marketAddress.toString());
      expect(res.duration).toEqual(1n);
    });

    await fetchArenaRegistryView()
      .then(({ currentMeleeID }) => currentMeleeID)
      .then(fetchArenaMeleeView)
      .then(fetchMeleeEmojiData)
      .then((melee) => {
        // The first two markets registered are registered in the docker deployer service.
        // See `src/docker/deployer`.
        expect(melee.market1.symbolData.symbol).toEqual("💧");
        expect(melee.market2.symbolData.symbol).toEqual("🔥");
      });
  });
});
