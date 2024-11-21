import {
  APTOS_NETWORK,
  getAptosApiKey,
  getEmojicoinMarketAddressAndTypeTags,
  INTEGRATOR_ADDRESS,
  INTEGRATOR_FEE_RATE_BPS,
  MODULE_ADDRESS,
  ONE_APT,
  REWARDS_MODULE_ADDRESS,
  REWARDS_MODULE_NAME,
  Trigger,
  zip,
  type SymbolEmoji,
} from "../../../../src";
import { getFundedAccount } from "../../../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../../../src/client/emojicoin-client";
import {
  Aptos,
  AptosConfig,
  Ed25519Account,
  type EntryFunctionPayloadResponse,
  Network,
} from "@aptos-labs/ts-sdk";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../../../src/utils/test/helpers";
import { getAptosClient } from "../../../../src/utils/aptos-client";
import { calculatePeriodBoundariesCrossed } from "../../../../src/utils/test";

jest.setTimeout(15000);

describe("all submission types for the emojicoin client", () => {
  const emojicoin = new EmojicoinClient();
  const senders = [
    getFundedAccount("048"),
    getFundedAccount("049"),
    getFundedAccount("050"),
    getFundedAccount("051"),
    getFundedAccount("052"),
    getFundedAccount("053"),
    getFundedAccount("054"),
    getFundedAccount("055"),
    getFundedAccount("056"),
    getFundedAccount("057"),
  ];
  const symbols: Array<SymbolEmoji[]> = [
    ["✨", "🌑"],
    ["✨", "🌒"],
    ["✨", "🌓"],
    ["✨", "🌔"],
    ["✨", "🌕"],
    ["✨", "🌖"],
    ["✨", "🌗"],
    ["✨", "🌘"],
    ["✨", "🌚"],
    ["✨", "🌙"],
  ];
  const senderAndSymbols = zip(senders, symbols);

  const functionNames = {
    registerMarket: `${MODULE_ADDRESS}::emojicoin_dot_fun::register_market`,
    swap: `${MODULE_ADDRESS}::emojicoin_dot_fun::swap`,
    chat: `${MODULE_ADDRESS}::emojicoin_dot_fun::chat`,
    removeLiquidity: `${MODULE_ADDRESS}::emojicoin_dot_fun::remove_liquidity`,
    provideLiquidity: `${MODULE_ADDRESS}::emojicoin_dot_fun::provide_liquidity`,
    rewardsSwap: `${REWARDS_MODULE_ADDRESS}::${REWARDS_MODULE_NAME}::swap_with_rewards`,
  };

  const gasOptions = {
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
  };

  it("converts emojis to a hex symbol", () => {
    const [_, emojis] = senderAndSymbols[0];
    const joined = emojis.join("");
    const bytes = new TextEncoder().encode(joined);
    expect(bytes).toEqual(emojicoin.utils.emojisToHexSymbol(emojis));
    expect(emojis.map((e) => new TextEncoder().encode(e))).toEqual(
      emojicoin.utils.emojisToHexStrings(emojis)
    );
  });
  it("converts emojis to hex strings", () => {
    const [_, emojis] = senderAndSymbols[0];
    const asBytes = emojis.map((e) => new TextEncoder().encode(e));
    expect(asBytes).toEqual(emojicoin.utils.emojisToHexStrings(emojis));
  });

  it("gets an emojicoin's market address and type tags derived from the emojis", () => {
    const [_, emojis] = senderAndSymbols[0];
    const symbolBytes = emojicoin.utils.emojisToHexSymbol(emojis);
    const info = getEmojicoinMarketAddressAndTypeTags({ symbolBytes });
    const { marketAddress, typeTags } = emojicoin.utils.getEmojicoinInfo(emojis);
    expect(marketAddress.equals(info.marketAddress)).toBe(true);
    expect(typeTags[0].toString()).toEqual(info.emojicoin.toString());
    expect(typeTags[1].toString()).toEqual(info.emojicoinLP.toString());
  });

  it("creates the aptos client with the correct configuration settings", () => {
    const config = new AptosConfig({
      network: Network.TESTNET,
    });
    const aptos = new Aptos(config);
    const emojicoinClient = new EmojicoinClient({ aptos });
    expect(emojicoinClient.aptos.config.network).toEqual(Network.TESTNET);
  });

  it("creates the aptos client with the correct default configuration settings", () => {
    expect(emojicoin.aptos.config.network).toEqual(process.env.NEXT_PUBLIC_APTOS_NETWORK);
    expect(emojicoin.aptos.config.network).toEqual(APTOS_NETWORK);
  });

  it("registers a market", async () => {
    const [sender, emojis] = senderAndSymbols[0];
    await emojicoin
      .register(sender, emojis, gasOptions)
      .then(({ response, events, registration }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.registerMarket);
        expect(events.chatEvents.length).toEqual(0);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(0);
        expect(events.periodicStateEvents.length).toEqual(0);
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(0);
        expect(events.marketRegistrationEvents.length).toEqual(1);
        expect(registration.event.registrant).toEqual(sender.accountAddress.toString());
        expect(registration.event.marketMetadata.emojiBytes).toEqual(
          emojicoin.utils.emojisToHexSymbol(emojis)
        );
        expect(registration.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(registration.model.market.trigger).toEqual(Trigger.MarketRegistration);
      });
  });
  it("swap buys", async () => {
    const [sender, emojis] = senderAndSymbols[1];
    const inputAmount = 7654321n;
    await emojicoin.register(sender, emojis, gasOptions).then(({ registration }) => {
      emojicoin.buy(sender, emojis, inputAmount).then(({ response, events, swap }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.swap);
        expect(events.chatEvents.length).toEqual(0);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(0);
        expect(events.periodicStateEvents.length).toEqual(
          calculatePeriodBoundariesCrossed({
            startMicroseconds: registration.event.time,
            endMicroseconds: swap.event.time,
          })
        );
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(1);
        expect(events.marketRegistrationEvents.length).toEqual(0);
        expect(swap.event.inputAmount).toEqual(inputAmount);
        expect(swap.event.isSell).toEqual(false);
        expect(swap.event.swapper).toEqual(sender.accountAddress.toString());
        expect(swap.event.integrator).toEqual(INTEGRATOR_ADDRESS.toString());
        expect(swap.event.integratorFeeRateBPs).toEqual(0);
        expect(swap.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(swap.model.market.trigger).toEqual(Trigger.SwapBuy);
      });
    });
  });
  it("swap sells", async () => {
    const [sender, emojis] = senderAndSymbols[2];
    const inputAmount = 7654321n;
    await emojicoin.register(sender, emojis, gasOptions);
    await emojicoin.buy(sender, emojis, inputAmount).then(({ swap: buy }) => {
      emojicoin.sell(sender, emojis, inputAmount).then(({ response, events, swap: sell }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.swap);
        expect(events.chatEvents.length).toEqual(0);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(0);
        expect(events.periodicStateEvents.length).toEqual(
          calculatePeriodBoundariesCrossed({
            startMicroseconds: buy.event.time,
            endMicroseconds: sell.event.time,
          })
        );
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(1);
        expect(events.marketRegistrationEvents.length).toEqual(0);
        expect(sell.event.inputAmount).toEqual(inputAmount);
        expect(sell.event.isSell).toEqual(true);
        expect(sell.event.swapper).toEqual(sender.accountAddress.toString());
        expect(sell.event.integrator).toEqual(INTEGRATOR_ADDRESS.toString());
        expect(sell.event.integratorFeeRateBPs).toEqual(0);
        expect(sell.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(sell.model.market.trigger).toEqual(Trigger.SwapSell);
      });
    });
  });

  it("uses custom defaults", async () => {
    const config = new AptosConfig({ network: Network.MAINNET });
    const emojicoin2 = new EmojicoinClient({
      aptos: new Aptos(config),
      integrator: "0x0",
      integratorFeeRateBPs: 123,
      minOutputAmount: 1337n,
    });
    // @ts-expect-error Checking private fields of the EmojicoinClient class instance.
    const { aptos, integrator, integratorFeeRateBPs, minOutputAmount } = emojicoin2;
    expect(aptos.config.network).toEqual(Network.MAINNET);
    expect(integrator.toString()).toEqual("0x0");
    expect(integratorFeeRateBPs).toEqual(123);
    expect(minOutputAmount).toEqual(1337n);
    // @ts-expect-error Checking private fields of the test default EmojicoinClient class instance.
    const { integrator: a, integratorFeeRateBPs: b, minOutputAmount: c } = emojicoin;
    expect(emojicoin.aptos.config.network).not.toEqual(Network.MAINNET);
    expect(a.toString()).not.toEqual("0x0");
    expect(b).not.toEqual(123);
    expect(c).not.toEqual(1337n);
  });

  it("sends a chat message", async () => {
    const [sender, emojis] = senderAndSymbols[3];
    const [a, b] = emojis;
    const expectedMessage = [a, b, b, a].join("");
    await emojicoin.register(sender, emojis, gasOptions).then(({ registration }) => {
      emojicoin.chat(sender, emojis, [a, b, b, a]).then(({ response, events, chat }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.chat);
        expect(events.chatEvents.length).toEqual(1);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(0);
        expect(events.periodicStateEvents.length).toEqual(
          calculatePeriodBoundariesCrossed({
            startMicroseconds: registration.event.time,
            endMicroseconds: chat.event.emitTime,
          })
        );
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(0);
        expect(events.marketRegistrationEvents.length).toEqual(0);
        expect(chat.event.message).toEqual(expectedMessage);
        expect(chat.event.user).toEqual(sender.accountAddress.toString());
        expect(chat.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(chat.model.market.trigger).toEqual(Trigger.Chat);
      });
    });
  });
  it("provides liquidity", async () => {
    const [sender, emojis] = senderAndSymbols[4];
    const inputAmount = 12386n;
    await emojicoin.register(sender, emojis, gasOptions);
    await emojicoin.buy(sender, emojis, EXACT_TRANSITION_INPUT_AMOUNT).then(({ swap }) => {
      emojicoin.liquidity
        .provide(sender, emojis, inputAmount)
        .then(({ response, events, liquidity }) => {
          const { success } = response;
          const payload = response.payload as EntryFunctionPayloadResponse;
          expect(success).toBe(true);
          expect(payload.function).toEqual(functionNames.provideLiquidity);
          expect(events.chatEvents.length).toEqual(0);
          expect(events.globalStateEvents.length).toEqual(0);
          expect(events.liquidityEvents.length).toEqual(1);
          expect(events.periodicStateEvents.length).toEqual(
            calculatePeriodBoundariesCrossed({
              startMicroseconds: swap.event.time,
              endMicroseconds: liquidity.event.time,
            })
          );
          expect(events.stateEvents.length).toEqual(1);
          expect(events.swapEvents.length).toEqual(0);
          expect(events.marketRegistrationEvents.length).toEqual(0);
          expect(liquidity.event.quoteAmount).toEqual(inputAmount);
          expect(liquidity.event.provider).toEqual(sender.accountAddress.toString());
          expect(liquidity.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
          expect(liquidity.model.market.trigger).toEqual(Trigger.ProvideLiquidity);
        });
    });
  });
  it("removes liquidity", async () => {
    const [sender, emojis] = senderAndSymbols[5];
    await emojicoin.register(sender, emojis, gasOptions);
    await emojicoin.buy(sender, emojis, EXACT_TRANSITION_INPUT_AMOUNT);
    await emojicoin.liquidity.provide(sender, emojis, 59182n).then(({ liquidity: provide }) => {
      const lpCoinAmount = provide.event.lpCoinAmount;
      emojicoin.liquidity
        .remove(sender, emojis, lpCoinAmount)
        .then(({ response, events, liquidity: remove }) => {
          const { success } = response;
          const payload = response.payload as EntryFunctionPayloadResponse;
          expect(success).toBe(true);
          expect(payload.function).toEqual(functionNames.removeLiquidity);
          expect(events.chatEvents.length).toEqual(0);
          expect(events.globalStateEvents.length).toEqual(0);
          expect(events.liquidityEvents.length).toEqual(1);
          expect(events.periodicStateEvents.length).toEqual(
            calculatePeriodBoundariesCrossed({
              startMicroseconds: provide.event.time,
              endMicroseconds: remove.event.time,
            })
          );
          expect(events.stateEvents.length).toEqual(1);
          expect(events.swapEvents.length).toEqual(0);
          expect(events.marketRegistrationEvents.length).toEqual(0);
          expect(remove.event.provider).toEqual(sender.accountAddress.toString());
          expect(remove.event.lpCoinAmount).toEqual(lpCoinAmount);
          expect(remove.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
          expect(remove.model.market.trigger).toEqual(Trigger.RemoveLiquidity);
        });
    });
  });

  it("swap buys with the rewards contract", async () => {
    const [sender, emojis] = senderAndSymbols[6];
    const inputAmount = 1234567n;
    await emojicoin.register(sender, emojis, gasOptions).then(({ registration }) => {
      emojicoin.rewards.buy(sender, emojis, inputAmount).then(({ response, events, swap }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.rewardsSwap);
        expect(events.chatEvents.length).toEqual(0);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(0);
        expect(events.periodicStateEvents.length).toEqual(
          calculatePeriodBoundariesCrossed({
            startMicroseconds: registration.event.time,
            endMicroseconds: swap.event.time,
          })
        );
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(1);
        expect(events.marketRegistrationEvents.length).toEqual(0);
        expect(swap.event.inputAmount).toEqual(inputAmount);
        expect(swap.event.isSell).toEqual(false);
        expect(swap.event.swapper).toEqual(sender.accountAddress.toString());
        expect(swap.event.integrator).toEqual(INTEGRATOR_ADDRESS.toString());
        expect(swap.event.integratorFeeRateBPs).toEqual(INTEGRATOR_FEE_RATE_BPS);
        expect(swap.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(swap.model.market.trigger).toEqual(Trigger.SwapBuy);
      });
    });
  });
  it("swap sells with the rewards contract", async () => {
    const [sender, emojis] = senderAndSymbols[7];
    const inputAmount = 1234567n;
    await emojicoin.register(sender, emojis, gasOptions);
    await emojicoin.rewards.buy(sender, emojis, inputAmount).then(({ swap: buy }) => {
      emojicoin.rewards
        .sell(sender, emojis, inputAmount)
        .then(({ response, events, swap: sell }) => {
          const { success } = response;
          const payload = response.payload as EntryFunctionPayloadResponse;
          expect(success).toBe(true);
          expect(payload.function).toEqual(functionNames.rewardsSwap);
          expect(events.chatEvents.length).toEqual(0);
          expect(events.globalStateEvents.length).toEqual(0);
          expect(events.liquidityEvents.length).toEqual(0);
          expect(events.periodicStateEvents.length).toEqual(
            calculatePeriodBoundariesCrossed({
              startMicroseconds: buy.event.time,
              endMicroseconds: sell.event.time,
            })
          );
          expect(events.stateEvents.length).toEqual(1);
          expect(events.swapEvents.length).toEqual(1);
          expect(events.marketRegistrationEvents.length).toEqual(0);
          expect(sell.event.inputAmount).toEqual(inputAmount);
          expect(sell.event.isSell).toEqual(true);
          expect(sell.event.swapper).toEqual(sender.accountAddress.toString());
          expect(sell.event.integrator).toEqual(INTEGRATOR_ADDRESS.toString());
          expect(sell.event.integratorFeeRateBPs).toEqual(INTEGRATOR_FEE_RATE_BPS);
          expect(sell.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
          expect(sell.model.market.trigger).toEqual(Trigger.SwapSell);
        });
    });
  });

  it("buys with a custom integrator and fee rate", async () => {
    const inputAmount = 10_000_000n;
    const [sender, emojis] = senderAndSymbols[8];
    const randomIntegrator = Ed25519Account.generate();
    const customIntegrator = randomIntegrator.accountAddress;
    const customFeeRateBPs = 100;
    const clientWithCustomDefaults = new EmojicoinClient({
      integrator: customIntegrator,
      integratorFeeRateBPs: customFeeRateBPs,
    });

    await clientWithCustomDefaults.register(sender, emojis);
    await clientWithCustomDefaults
      .buy(sender, emojis, inputAmount)
      .then(({ response, events, swap }) => {
        const { success } = response;
        expect(success).toBe(true);
        expect(events.swapEvents.length).toEqual(1);
        expect(swap.event.inputAmount).toEqual(inputAmount);
        expect(swap.event.integrator).toEqual(customIntegrator.toString());
        expect(swap.event.integratorFeeRateBPs).toEqual(customFeeRateBPs);
      });
  });

  it("sells with a custom integrator and fee rate", async () => {
    const inputAmount = 10_000_000n;
    const [sender, emojis] = senderAndSymbols[9];
    const randomIntegrator = Ed25519Account.generate();
    const customIntegrator = randomIntegrator.accountAddress;
    const customFeeRateBPs = 100;
    const clientWithCustomDefaults = new EmojicoinClient({
      integrator: customIntegrator,
      integratorFeeRateBPs: customFeeRateBPs,
    });

    await clientWithCustomDefaults.register(sender, emojis);
    await clientWithCustomDefaults.buy(sender, emojis, inputAmount);
    await clientWithCustomDefaults
      .sell(sender, emojis, inputAmount)
      .then(({ response, events, swap }) => {
        const { success } = response;
        expect(success).toBe(true);
        expect(events.swapEvents.length).toEqual(1);
        expect(swap.event.inputAmount).toEqual(inputAmount);
        expect(swap.event.integrator).toEqual(customIntegrator.toString());
        expect(swap.event.integratorFeeRateBPs).toEqual(customFeeRateBPs);
      });
  });
});
