import { AccountAddressInput } from "@aptos-labs/ts-sdk";
import {
  INTEGRATOR_FEE_RATE_BPS,
  ONE_APT,
  INITIAL_REAL_RESERVES,
  INITIAL_VIRTUAL_RESERVES,
} from "../../src/const";
import {
  getMarketResource,
  maxBigInt,
  SYMBOL_EMOJI_DATA,
  SymbolEmoji,
  Types,
  zip,
} from "../../src";
import {
  calculateSwapNetProceeds,
  deriveEmojicoinPublisherAddress,
} from "../../src/emojicoin_dot_fun";
import { EXACT_TRANSITION_INPUT_AMOUNT, getPublishHelpers } from "../../src/utils/test";
import { getFundedAccounts } from "../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";

jest.setTimeout(30000);

describe("tests the swap functionality", () => {
  const { aptos } = getPublishHelpers();
  const registrants = getFundedAccounts("058", "059", "060", "061", "062", "063");
  const secondaryTraders = getFundedAccounts("064", "065", "066", "067", "068");
  const marketEmojis = ([["👱"], ["👱🏻"], ["👱🏼"], ["👱🏽"], ["👱🏾"], ["👱🏿"]] as SymbolEmoji[][]).map(
    (symbol) => symbol.map((e) => SYMBOL_EMOJI_DATA.byEmojiStrict(e))
  );
  const marketSymbols = marketEmojis.map((emojis) => emojis.map((e) => e.emoji));
  const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS });
  let maxRegisterTxnVersion: bigint;

  // A helper function to get a market resource. We embed the latest market registration
  // transaction version into this function so that all Market resources can be found on-chain at
  // the time of the query.
  let getMarketResourceHelper: (
    marketAddress: AccountAddressInput
  ) => ReturnType<typeof getMarketResource>;
  const getMarketAddress = (emojis: SymbolEmoji[]) => deriveEmojicoinPublisherAddress({ emojis });

  beforeAll(async () => {
    const versions = await Promise.all(
      zip(registrants, marketEmojis).map(([registrant, marketEmojis]) =>
        emojicoin
          .register(
            registrant,
            marketEmojis.map((emojiData) => emojiData.emoji)
          )
          .then((res) => {
            expect(res.response.success).toBe(true);
            return BigInt(res.response.version);
          })
      )
    );
    maxRegisterTxnVersion = maxBigInt(...versions);
    getMarketResourceHelper = (marketAddress) =>
      getMarketResource({ aptos, marketAddress, ledgerVersion: maxRegisterTxnVersion });
    return true;
  });

  it("returns a different value if the emojicoin balance is different", async () => {});

  /**
   *
   */

  it("first buyer on a market buys halfway through bonding curve", async () => {
    const idx = 0;
    const isSell = false;
    const inputAmount = ONE_APT * 500;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress);
    const viewSimulationOutput = await emojicoin.view.simulateBuy({
      symbolEmojis: marketSymbols[idx],
      swapper: registrants[idx].accountAddress,
      inputAmount,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves: market.clammVirtualReserves,
      cpammRealReserves: market.cpammRealReserves,
      startsInBondingCurve: true,
      isSell,
      inputAmount: inputAmount,
      userEmojicoinBalance: 0,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("the second buyer on a market buys past the bonding curve", async () => {
    const idx = 1;
    const [firstSwapper, secondSwapper] = [registrants[idx], secondaryTraders[idx]];
    // Have the registrant buy just barely not enough to move through the bonding curve.
    // That is, one more octa would mean it moves out of bonding curve from the swap buy.
    const justNotEnough = EXACT_TRANSITION_INPUT_AMOUNT - 1n;
    const res = await emojicoin.buy(firstSwapper, marketSymbols[idx], justNotEnough);
    const { model } = res.swap;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress);
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(false);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);
  });

  it("the second buyer on a market buys to an EXACT state transition", async () => {
    const idx = 2;
  });

  it("the second trader on a market sells into the bonding curve", async () => {
    const idx = 3;
  });

  it("the second trader on a market sells once it's outside the bonding curve", async () => {
    const idx = 4;
  });

  it("verifies that a market's initial virtual and real reserves are expected", async () => {
    const idx = 5;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress);
    expect(market.clammVirtualReserves).toEqual(INITIAL_VIRTUAL_RESERVES);
    expect(market.cpammRealReserves).toEqual(INITIAL_REAL_RESERVES);
  });
});
