import { ARENA_MODULE_ADDRESS, EmojicoinArena, getAptosClient } from "../../src";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { fetchArenaMeleeView } from "../../src/markets/arena-utils";

describe("ensures the two arena markets and the arena module are on-chain", () => {
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

  it("verifies an arena has already started", async () => {
    const water = emojicoin.utils.getEmojicoinInfo(["💧"]);
    const fire = emojicoin.utils.getEmojicoinInfo(["🔥"]);
    await fetchArenaMeleeView(1n).then((res) => {
      expect(res.emojicoin0MarketAddress).toEqual(water.marketAddress.toString());
      expect(res.emojicoin1MarketAddress).toEqual(fire.marketAddress.toString());
    });
  });
});
