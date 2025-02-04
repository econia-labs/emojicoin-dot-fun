import { ARENA_MODULE_ADDRESS, EmojicoinArena, getAptosClient } from "../../src";
import { EmojicoinClient } from "../../src/client/emojicoin-client";

describe("ensures the two arena markets and the arena module are on-chain", () => {
  const emojicoin = new EmojicoinClient();
  const aptos = getAptosClient();
  it("verifies that the arena module is already published on-chain", async () => {
    const res = await aptos.getAccountModule({
      accountAddress: ARENA_MODULE_ADDRESS,
      moduleName: EmojicoinArena.Enter.prototype.moduleName,
    });
    expect(res.bytecode).toBeTruthy();
  });

  it("verifies that both arena markets in the `deployer` service are registered on-chain", async () => {
    await emojicoin.view.marketExists(["💧"]).then((exists) => expect(exists).toBe(true));
    await emojicoin.view.marketExists(["🔥"]).then((exists) => expect(exists).toBe(true));
  });
});
