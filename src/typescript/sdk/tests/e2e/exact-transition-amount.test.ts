import { INTEGRATOR_FEE_RATE_BPS } from "../../src/const";
import { SYMBOL_EMOJI_DATA, type SymbolEmoji, zip } from "../../src";
import { getFundedAccounts } from "../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { getExactTransitionInputAmount } from "./helpers/misc";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../src/utils/test";

jest.setTimeout(30000);

describe("tests the exact transition input amount with integrator fees calculations", () => {
  const registrants = getFundedAccounts("069", "070", "071", "072");
  const marketEmojis = ([["☃️"], ["⛄"], ["🌨️"], ["❄️"]] as SymbolEmoji[][]).map((symbol) =>
    symbol.map((e) => SYMBOL_EMOJI_DATA.byEmojiStrict(e))
  );
  const marketSymbols = marketEmojis.map((emojis) => emojis.map((e) => e.emoji));
  const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS });

  beforeAll(async () => {
    const responses = await Promise.all(
      zip(registrants, marketEmojis).map(([registrant, marketEmojis]) =>
        emojicoin
          .register(
            registrant,
            marketEmojis.map((emojiData) => emojiData.emoji)
          )
          .then(({ response }) => response.success)
      )
    );
    expect(responses.every((v) => v));
    return true;
  });

  it("exits the bonding curve with the default env integrator fee", async () => {
    const idx = 0;
    const [buyer, symbol] = [registrants[idx], marketSymbols[idx]];
    const inputAmount = getExactTransitionInputAmount();
    const res = await emojicoin.buy(buyer, symbol, inputAmount);
    const { model } = res.swap;

    expect(model.swap.quoteVolume).toEqual(EXACT_TRANSITION_INPUT_AMOUNT);
    expect(model.state.lpCoinSupply).not.toEqual(0n);
    expect(model.swap.integratorFeeRateBPs).toEqual(INTEGRATOR_FEE_RATE_BPS);
    expect(model.swap.startsInBondingCurve).toEqual(true);
    expect(model.swap.resultsInStateTransition).toEqual(true);
  });

  it("just barely doesn't exit the bonding curve with the default env integrator fee", async () => {
    const idx = 1;
    const [buyer, symbol] = [registrants[idx], marketSymbols[idx]];
    const inputAmount = getExactTransitionInputAmount() - 1n;
    const res = await emojicoin.buy(buyer, symbol, inputAmount);
    const { model } = res.swap;

    expect(model.swap.quoteVolume).toEqual(EXACT_TRANSITION_INPUT_AMOUNT - 1n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.integratorFeeRateBPs).toEqual(INTEGRATOR_FEE_RATE_BPS);
    expect(model.swap.startsInBondingCurve).toEqual(true);
    expect(model.swap.resultsInStateTransition).toEqual(false);

    // Push it over the bonding curve with the smallest amount possible.
    const res2 = await emojicoin.buy(buyer, symbol, 1n);
    const { model: model2 } = res2.swap;
    expect(model2.state.lpCoinSupply).not.toEqual(0n);
    expect(model2.swap.integratorFeeRateBPs).toEqual(INTEGRATOR_FEE_RATE_BPS);
    expect(model2.swap.startsInBondingCurve).toEqual(true);
    expect(model2.swap.resultsInStateTransition).toEqual(true);
  });

  it("exits the bonding curve with a custom integrator fee", async () => {
    const idx = 2;
    const customFee = 250;
    const customIntegratorFeeClient = new EmojicoinClient({ integratorFeeRateBPs: customFee });
    const [buyer, symbol] = [registrants[idx], marketSymbols[idx]];
    const inputAmount = getExactTransitionInputAmount(customFee);
    const res = await customIntegratorFeeClient.buy(buyer, symbol, inputAmount);
    const { model } = res.swap;

    expect(model.swap.quoteVolume).toEqual(EXACT_TRANSITION_INPUT_AMOUNT);
    expect(model.state.lpCoinSupply).not.toEqual(0n);
    expect(model.swap.integratorFeeRateBPs).toEqual(customFee);
    expect(model.swap.startsInBondingCurve).toEqual(true);
    expect(model.swap.resultsInStateTransition).toEqual(true);
  });

  it("just barely doesn't exit the bonding curve with a custom integrator fee", async () => {
    const idx = 3;
    const customFee = 250;
    const customIntegratorFeeClient = new EmojicoinClient({ integratorFeeRateBPs: customFee });
    const [buyer, symbol] = [registrants[idx], marketSymbols[idx]];
    const inputAmount = getExactTransitionInputAmount(customFee) - 1n;
    const res = await customIntegratorFeeClient.buy(buyer, symbol, inputAmount);
    const { model } = res.swap;

    expect(model.swap.quoteVolume).toEqual(EXACT_TRANSITION_INPUT_AMOUNT - 1n);
    expect(model.state.lpCoinSupply).toEqual(0n);
    expect(model.swap.integratorFeeRateBPs).toEqual(customFee);
    expect(model.swap.startsInBondingCurve).toEqual(true);
    expect(model.swap.resultsInStateTransition).toEqual(false);

    // Push it over the bonding curve with the smallest amount possible.
    const res2 = await customIntegratorFeeClient.buy(buyer, symbol, 1n);
    const { model: model2 } = res2.swap;
    expect(model2.state.lpCoinSupply).not.toEqual(0n);
    expect(model2.swap.integratorFeeRateBPs).toEqual(customFee);
    expect(model2.swap.startsInBondingCurve).toEqual(true);
    expect(model2.swap.resultsInStateTransition).toEqual(true);
  });

  it("calculates the correct no fee transition amount", () => {
    expect(getExactTransitionInputAmount(0)).toEqual(EXACT_TRANSITION_INPUT_AMOUNT);
  });
});
