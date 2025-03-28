import { EMOJICOIN_DOT_FUN_MODULE_NAME, getAptosClient, MODULE_ADDRESS } from "../../src";

describe("ensures the emojicoin_dot_fun.move module is published on the local network", () => {
  const aptos = getAptosClient();

  it("ensure the emojicoin_dot_fun.move module is published", async () => {
    await aptos
      .getAccountModule({
        accountAddress: MODULE_ADDRESS,
        moduleName: EMOJICOIN_DOT_FUN_MODULE_NAME,
      })
      .then(({ abi }) => {
        expect(abi).toBeDefined();
      });
  });
});
