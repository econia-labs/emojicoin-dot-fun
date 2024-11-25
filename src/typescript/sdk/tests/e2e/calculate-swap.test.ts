import { type AccountAddressInput } from "@aptos-labs/ts-sdk";
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
  type SymbolEmoji,
  toCoinTypes,
  zip,
} from "../../src";
import {
  calculateSwapNetProceeds,
  deriveEmojicoinPublisherAddress,
} from "../../src/emojicoin_dot_fun";
import { EXACT_TRANSITION_INPUT_AMOUNT, getPublishHelpers } from "../../src/utils/test";
import { getFundedAccounts } from "../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { TransferCoins } from "../../src/emojicoin_dot_fun/aptos-framework";

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

  it("first buyer on a market buys halfway through bonding curve", async () => {
    const idx = 0;
    const [firstSwapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];
    const isSell = false;
    const inputAmount = ONE_APT * 500;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress);
    const { clammVirtualReserves, cpammRealReserves } = market;

    const viewSimulationOutput = await emojicoin.view.simulateBuy({
      symbolEmojis,
      swapper: firstSwapper.accountAddress,
      inputAmount,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves,
      cpammRealReserves,
      startsInBondingCurve: true,
      isSell,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("the second buyer on a market buys past the bonding curve", async () => {
    const idx = 1;
    const [firstSwapper, _secondSwapper, symbolEmojis] = [
      registrants[idx],
      secondaryTraders[idx],
      marketSymbols[idx],
    ];
    // Have the registrant buy just barely not enough to move through the bonding curve.
    // That is, one more octa would mean it moves out of bonding curve from the swap buy.
    const justNotEnough = EXACT_TRANSITION_INPUT_AMOUNT - 1n;
    const res = await emojicoin.buy(firstSwapper, symbolEmojis, justNotEnough);

    const { model } = res.swap;
    const marketAddress = getMarketAddress(symbolEmojis);
    const market = await getMarketResourceHelper(marketAddress);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS NOT progressed past the bonding curve by checking the resource fields.
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(false);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    const inputAmount = 1n; // To push it just past the bonding curve.
    const viewSimulationOutput = await emojicoin.view.simulateBuy({
      symbolEmojis: symbolEmojis,
      swapper: firstSwapper.accountAddress,
      inputAmount,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves,
      cpammRealReserves,
      startsInBondingCurve: true,
      isSell: false,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("the second buyer on a market buys to an EXACT state transition", async () => {
    const idx = 2;
    const [firstSwapper, secondSwapper, symbolEmojis] = [
      registrants[idx],
      secondaryTraders[idx],
      marketSymbols[idx],
    ];
    // The registrant buys `1n` worth of emojicoin and the second buyer buys the rest to finish
    // the bonding curve.
    const firstInputAmount = 1n;
    const res = await emojicoin.buy(firstSwapper, symbolEmojis, firstInputAmount);

    const { model } = res.swap;
    const marketAddress = getMarketAddress(symbolEmojis);
    const market = await getMarketResourceHelper(marketAddress);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS NOT progressed past the bonding curve by checking the resource fields.
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(false);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    const inputAmount = EXACT_TRANSITION_INPUT_AMOUNT - firstInputAmount;
    const viewSimulationOutput = await emojicoin.view.simulateBuy({
      symbolEmojis: symbolEmojis,
      swapper: secondSwapper.accountAddress,
      inputAmount,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves,
      cpammRealReserves,
      startsInBondingCurve: true,
      isSell: false,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("the second trader on a market sells into the bonding curve", async () => {
    const idx = 3;
    const [firstSwapper, secondSwapper, symbolEmojis] = [
      registrants[idx],
      secondaryTraders[idx],
      marketSymbols[idx],
    ];
    // Buy some random amount less than what's necessary to end the bonding curve.
    const inputAmount = 74127356n;
    const res = await emojicoin.buy(firstSwapper, symbolEmojis, inputAmount);

    const { model } = res.swap;
    const marketAddress = getMarketAddress(symbolEmojis);
    const market = await getMarketResourceHelper(marketAddress);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS NOT progressed past the bonding curve.
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(false);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    // Transfer the emojicoins from the first swapper to the second.
    const { emojicoin: emojicoinType } = toCoinTypes(marketAddress);
    const transferRes = await TransferCoins.submit({
      aptosConfig: aptos.config,
      from: firstSwapper,
      to: secondSwapper.accountAddress,
      amount: inputAmount,
      typeTags: [emojicoinType],
    });
    expect(transferRes.success).toBe(true);

    // Have the second trader sell into the bonding curve with the same input amount that the first
    // trader (the registrant) bought earlier.
    const viewSimulationOutput = await emojicoin.view.simulateSell({
      symbolEmojis: symbolEmojis,
      swapper: secondSwapper.accountAddress,
      inputAmount,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves,
      cpammRealReserves,
      startsInBondingCurve: true,
      isSell: true,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("the second trader on a market sells once it's outside the bonding curve", async () => {
    const idx = 4;
    const [firstSwapper, secondSwapper, symbolEmojis] = [
      registrants[idx],
      secondaryTraders[idx],
      marketSymbols[idx],
    ];
    // Buy exactly enough to trigger a bonding curve transition.
    const res = await emojicoin.buy(firstSwapper, symbolEmojis, EXACT_TRANSITION_INPUT_AMOUNT);

    const { model } = res.swap;
    const marketAddress = getMarketAddress(symbolEmojis);
    const market = await getMarketResourceHelper(marketAddress);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS progressed past the bonding curve.
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(true);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    // Transfer the emojicoins from the first swapper to the second.
    const { emojicoin: emojicoinType } = toCoinTypes(marketAddress);
    const transferRes = await TransferCoins.submit({
      aptosConfig: aptos.config,
      from: firstSwapper,
      to: secondSwapper.accountAddress,
      amount: EXACT_TRANSITION_INPUT_AMOUNT,
      typeTags: [emojicoinType],
    });
    expect(transferRes.success).toBe(true);

    // Have the second trader sell the coins into a post-bonding curve market.
    const viewSimulationOutput = await emojicoin.view.simulateSell({
      symbolEmojis: symbolEmojis,
      swapper: secondSwapper.accountAddress,
      inputAmount: EXACT_TRANSITION_INPUT_AMOUNT,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves,
      cpammRealReserves,
      startsInBondingCurve: false,
      isSell: true,
      inputAmount: EXACT_TRANSITION_INPUT_AMOUNT,
      userEmojicoinBalance: EXACT_TRANSITION_INPUT_AMOUNT,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("verifies that a market's initial virtual and real reserves are expected", async () => {
    const idx = 5;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress);
    expect(market.clammVirtualReserves).toEqual(INITIAL_VIRTUAL_RESERVES);
    expect(market.cpammRealReserves).toEqual(INITIAL_REAL_RESERVES);
  });
});
