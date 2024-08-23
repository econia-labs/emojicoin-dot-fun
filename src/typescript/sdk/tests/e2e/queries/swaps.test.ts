import { Account, Aptos } from "@aptos-labs/ts-sdk";
import { AnyEmojiName } from "../../../src";
import { getTestHelpers, registerMarketTestHelper } from "../../utils/helpers";
import { SwapWithRewards } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";

describe("queries swap_events and returns accurate swap row data", () => {
  const registrant = Account.generate();
  const emojiNames: Array<AnyEmojiName> = ["pile of poo", "axe"];
  let aptos: Aptos;
  let {
    registerResponse,
    marketAddress,
    emojicoin,
    emojicoinLP,
    emojis,
    integrator,
  }: Awaited<ReturnType<typeof registerMarketTestHelper>> = {} as any;

  beforeAll(async () => {
    await registerMarketTestHelper({
      emojiNames,
      registrant,
    }).then((res) => {
      aptos = res.aptos;
      registerResponse = res.registerResponse;
      marketAddress = res.marketAddress;
      emojicoin = res.emojicoin;
      emojicoinLP = res.emojicoinLP;
      emojis = res.emojis;
      integrator = res.integrator;
      expect(registerResponse.success).toBe(true);
    });

    return true;
  });

  it("performs a simple fetch accurately", async () => {
    await SwapWithRewards.builder({
      aptosConfig: aptos.config,
      swapper: registrant,
      marketAddress,
      inputAmount: 100n,
      isSell: false,
      typeTags: [emojicoin, emojicoinLP],
    });
  });
});
