import { type AccountAddressInput } from "@aptos-labs/ts-sdk";
import {
  INTEGRATOR_FEE_RATE_BPS,
  ONE_APT,
  INITIAL_REAL_RESERVES,
  INITIAL_VIRTUAL_RESERVES,
} from "../../src/const";
import {
  type AnyNumberString,
  getMarketResource,
  maxBigInt,
  type SymbolEmoji,
  toCoinTypes,
  zip,
} from "../../src";
import { calculateSwapNetProceeds, getMarketAddress } from "../../src/emojicoin_dot_fun";
import { getPublishHelpers } from "../utils/helpers";
import { getFundedAccounts } from "../utils/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { TransferCoins } from "@/contract-apis";
import { getExactTransitionInputAmount } from "./helpers/misc";
import { getCoinBalanceFromChanges } from "../../src/utils/parse-changes-for-balances";

jest.setTimeout(30000);

const exactTransitionInputAmount = getExactTransitionInputAmount();

describe("tests the swap functionality", () => {
  const { aptos } = getPublishHelpers();
  const registrants = getFundedAccounts("058", "059", "060", "061", "062", "063");
  const secondaryTraders = getFundedAccounts("064", "065", "066", "067", "068");
  const marketSymbols: SymbolEmoji[][] = [["👱"], ["👱🏻"], ["👱🏼"], ["👱🏽"], ["👱🏾"], ["👱🏿"]];
  const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS });
  let maxRegisterTxnVersion: bigint;

  let getMarketResourceHelper: (
    marketAddress: AccountAddressInput,
    version: AnyNumberString
  ) => ReturnType<typeof getMarketResource>;
  beforeAll(async () => {
    const versions = await Promise.all(
      zip(registrants, marketSymbols).map(([registrant, emojis]) =>
        emojicoin.register(registrant, emojis).then((res) => {
          expect(res.response.success).toBe(true);
          return BigInt(res.response.version);
        })
      )
    );
    maxRegisterTxnVersion = maxBigInt(...versions);
    getMarketResourceHelper = (marketAddress, version) =>
      getMarketResource({ aptos, marketAddress, ledgerVersion: BigInt(version) });
    return true;
  });

  it("first buyer on a market buys halfway through the bonding curve", async () => {
    const idx = 0;
    const [firstSwapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];
    const isSell = false;
    const inputAmount = ONE_APT * 500;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress, maxRegisterTxnVersion);
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
    const [firstSwapper, secondSwapper, symbolEmojis] = [
      registrants[idx],
      secondaryTraders[idx],
      marketSymbols[idx],
    ];
    // Have the registrant buy just barely not enough to move through the bonding curve.
    // That is, one more octa would mean it moves out of bonding curve from the swap buy.
    const justNotEnough = exactTransitionInputAmount - 1n;
    const res = await emojicoin.buy(firstSwapper, symbolEmojis, justNotEnough);

    const { model } = res.swap;
    const marketAddress = getMarketAddress(symbolEmojis);
    const market = await getMarketResourceHelper(marketAddress, res.response.version);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS NOT progressed past the bonding curve by checking the resource fields.
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(false);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    const inputAmount = 123456n;
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
    const market = await getMarketResourceHelper(marketAddress, res.response.version);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS NOT progressed past the bonding curve by checking the resource fields.
    expect(market.lpCoinSupply).toEqual(0n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(false);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    const inputAmount = exactTransitionInputAmount - firstInputAmount;
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
    const market = await getMarketResourceHelper(marketAddress, res.response.version);
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
    const res = await emojicoin.buy(firstSwapper, symbolEmojis, exactTransitionInputAmount);

    const { model } = res.swap;
    const marketAddress = getMarketAddress(symbolEmojis);
    const market = await getMarketResourceHelper(marketAddress, res.response.version);
    const { clammVirtualReserves, cpammRealReserves } = market;

    // Ensure the market HAS progressed past the bonding curve.
    expect(market.lpCoinSupply).not.toEqual(0n);
    expect(model.state.lpCoinSupply).not.toEqual(0n);
    expect(model.swap.startsInBondingCurve).toBe(true);
    expect(model.swap.resultsInStateTransition).toBe(true);
    expect(model.market.marketNonce).toEqual(market.sequenceInfo.nonce);

    // Transfer the emojicoins from the first swapper to the second.
    const { emojicoin: emojicoinType } = toCoinTypes(marketAddress);
    const transferRes = await TransferCoins.submit({
      aptosConfig: aptos.config,
      from: firstSwapper,
      to: secondSwapper.accountAddress,
      amount: res.swap.model.swap.netProceeds,
      typeTags: [emojicoinType],
    });
    expect(transferRes.success).toBe(true);

    const balance = getCoinBalanceFromChanges({
      response: transferRes,
      userAddress: secondSwapper.accountAddress,
      coinType: emojicoinType,
    })!;
    expect(balance).toBeDefined();
    expect(balance).toEqual(res.swap.model.swap.netProceeds);

    // Have the second trader sell the coins into a post-bonding curve market.
    const viewSimulationOutput = await emojicoin.view.simulateSell({
      symbolEmojis: symbolEmojis,
      swapper: secondSwapper.accountAddress,
      inputAmount: balance,
    });
    const { netProceeds } = calculateSwapNetProceeds({
      clammVirtualReserves,
      cpammRealReserves,
      startsInBondingCurve: false,
      isSell: true,
      inputAmount: balance,
      userEmojicoinBalance: balance,
    });
    expect(viewSimulationOutput.netProceeds).toEqual(netProceeds);
  });

  it("verifies that a market's initial virtual and real reserves are expected", async () => {
    const idx = 5;
    const marketAddress = getMarketAddress(marketSymbols[idx]);
    const market = await getMarketResourceHelper(marketAddress, maxRegisterTxnVersion);
    expect(market.clammVirtualReserves).toEqual(INITIAL_VIRTUAL_RESERVES);
    expect(market.cpammRealReserves).toEqual(INITIAL_REAL_RESERVES);
  });
});
