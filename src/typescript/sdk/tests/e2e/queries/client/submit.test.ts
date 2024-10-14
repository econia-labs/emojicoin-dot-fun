import {
  getEmojicoinMarketAddressAndTypeTags,
  INTEGRATOR_ADDRESS,
  MODULE_ADDRESS,
  ONE_APT,
  REWARDS_MODULE_ADDRESS,
  REWARDS_MODULE_NAME,
  Trigger,
  zip,
  type MarketSymbolEmojis,
} from "../../../../src";
import { getFundedAccount } from "../../../utils/test-accounts";
import { EmojicoinClient } from "../../../../src/client/emojicoin-client";
import { EXACT_TRANSITION_INPUT_AMOUNT, getAptosNetwork } from "../../../utils";
import { Aptos, AptosConfig, type EntryFunctionPayloadResponse, Network } from "@aptos-labs/ts-sdk";

jest.setTimeout(15000);

describe("all submission types for the emojicoin client", () => {
  // Use a custom integrator here so that it's possible to differentiate between the integrator
  // in regular `swap` buys vs `rewards` contract swap buys (and thus ensure it's set correctly).
  const integrator = getFundedAccount("048").accountAddress;
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
  ];
  const symbols: MarketSymbolEmojis[] = [
    ["✨", "🌑"],
    ["✨", "🌒"],
    ["✨", "🌓"],
    ["✨", "🌔"],
    ["✨", "🌕"],
    ["✨", "🌖"],
    ["✨", "🌗"],
    ["✨", "🌘"],
  ];
  const senderAndSymbols = zip(senders, symbols);

  const swapArgs = {
    inputAmount: 7654321n,
    minOutputAmount: 1n,
    integrator,
    integratorFeeRateBPs: 0,
  };

  const buyEntireBondingCurveArgs = {
    ...swapArgs,
    inputAmount: EXACT_TRANSITION_INPUT_AMOUNT,
  };

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
    expect(emojicoin.aptos.config.network).toEqual(getAptosNetwork());
  });

  it("registers a market", async () => {
    const [sender, emojis] = senderAndSymbols[0];
    await emojicoin
      .register(sender, emojis, { integrator }, gasOptions)
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
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin.buy(sender, emojis, swapArgs).then(({ response, events, swap }) => {
      const { success } = response;
      const payload = response.payload as EntryFunctionPayloadResponse;
      expect(success).toBe(true);
      expect(payload.function).toEqual(functionNames.swap);
      expect(events.chatEvents.length).toEqual(0);
      expect(events.globalStateEvents.length).toEqual(0);
      expect(events.liquidityEvents.length).toEqual(0);
      expect(events.periodicStateEvents.length).toEqual(0);
      expect(events.stateEvents.length).toEqual(1);
      expect(events.swapEvents.length).toEqual(1);
      expect(events.marketRegistrationEvents.length).toEqual(0);
      expect(swap.event.inputAmount).toEqual(swapArgs.inputAmount);
      expect(swap.event.isSell).toEqual(false);
      expect(swap.event.swapper).toEqual(sender.accountAddress.toString());
      expect(swap.event.integrator).toEqual(integrator.toString());
      expect(swap.event.integrator).not.toEqual(INTEGRATOR_ADDRESS.toString());
      expect(swap.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
      expect(swap.model.market.trigger).toEqual(Trigger.SwapBuy);
    });
  });
  it("swap sells", async () => {
    const [sender, emojis] = senderAndSymbols[2];
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin.buy(sender, emojis, swapArgs);
    await emojicoin.sell(sender, emojis, swapArgs).then(({ response, events, swap }) => {
      const { success } = response;
      const payload = response.payload as EntryFunctionPayloadResponse;
      expect(success).toBe(true);
      expect(payload.function).toEqual(functionNames.swap);
      expect(events.chatEvents.length).toEqual(0);
      expect(events.globalStateEvents.length).toEqual(0);
      expect(events.liquidityEvents.length).toEqual(0);
      expect(events.periodicStateEvents.length).toEqual(0);
      expect(events.stateEvents.length).toEqual(1);
      expect(events.swapEvents.length).toEqual(1);
      expect(events.marketRegistrationEvents.length).toEqual(0);
      expect(swap.event.inputAmount).toEqual(swapArgs.inputAmount);
      expect(swap.event.isSell).toEqual(true);
      expect(swap.event.swapper).toEqual(sender.accountAddress.toString());
      expect(swap.event.integrator).toEqual(integrator.toString());
      expect(swap.event.integrator).not.toEqual(INTEGRATOR_ADDRESS.toString());
      expect(swap.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
      expect(swap.model.market.trigger).toEqual(Trigger.SwapSell);
    });
  });
  it("sends a chat message", async () => {
    const [sender, emojis] = senderAndSymbols[3];
    const emojiIndicesSequence = [0, 1, 1, 0];
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin
      .chat(sender, emojis, {
        chatEmojis: emojis,
        emojiIndicesSequence,
      })
      .then(({ response, events, chat }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.chat);
        expect(events.chatEvents.length).toEqual(1);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(0);
        expect(events.periodicStateEvents.length).toEqual(0);
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(0);
        expect(events.marketRegistrationEvents.length).toEqual(0);
        const expectedMessage = emojiIndicesSequence.map((v) => emojis[v]).join("");
        expect(chat.event.message).toEqual(expectedMessage);
        expect(chat.event.user).toEqual(sender.accountAddress.toString());
        expect(chat.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(chat.model.market.trigger).toEqual(Trigger.Chat);
      });
  });
  it("provides liquidity", async () => {
    const [sender, emojis] = senderAndSymbols[4];
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin.buy(sender, emojis, buyEntireBondingCurveArgs);
    await emojicoin.liquidity
      .provide(sender, emojis, {
        quoteAmount: 12386n,
        minLpCoinsOut: 1n,
      })
      .then(({ response, events, liquidity }) => {
        const { success } = response;
        const payload = response.payload as EntryFunctionPayloadResponse;
        expect(success).toBe(true);
        expect(payload.function).toEqual(functionNames.provideLiquidity);
        expect(events.chatEvents.length).toEqual(0);
        expect(events.globalStateEvents.length).toEqual(0);
        expect(events.liquidityEvents.length).toEqual(1);
        expect(events.periodicStateEvents.length).toEqual(0);
        expect(events.stateEvents.length).toEqual(1);
        expect(events.swapEvents.length).toEqual(0);
        expect(events.marketRegistrationEvents.length).toEqual(0);
        expect(liquidity.event.quoteAmount).toEqual(12386n);
        expect(liquidity.event.provider).toEqual(sender.accountAddress.toString());
        expect(liquidity.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
        expect(liquidity.model.market.trigger).toEqual(Trigger.ProvideLiquidity);
      });
  });
  it("removes liquidity", async () => {
    const [sender, emojis] = senderAndSymbols[5];
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin.buy(sender, emojis, buyEntireBondingCurveArgs);
    await emojicoin.liquidity
      .provide(sender, emojis, {
        quoteAmount: 59182n,
        minLpCoinsOut: 1n,
      })
      .then(({ liquidity }) => {
        const lpCoinAmount = liquidity.event.lpCoinAmount;
        emojicoin.liquidity
          .remove(sender, emojis, {
            lpCoinAmount,
            minQuoteOut: 1n,
          })
          .then(({ response, events, liquidity }) => {
            const { success } = response;
            const payload = response.payload as EntryFunctionPayloadResponse;
            expect(success).toBe(true);
            expect(payload.function).toEqual(functionNames.removeLiquidity);
            expect(events.chatEvents.length).toEqual(0);
            expect(events.globalStateEvents.length).toEqual(0);
            expect(events.liquidityEvents.length).toEqual(1);
            expect(events.periodicStateEvents.length).toEqual(0);
            expect(events.stateEvents.length).toEqual(1);
            expect(events.swapEvents.length).toEqual(0);
            expect(events.marketRegistrationEvents.length).toEqual(0);
            expect(liquidity.event.provider).toEqual(sender.accountAddress.toString());
            expect(liquidity.event.lpCoinAmount).toEqual(lpCoinAmount);
            expect(liquidity.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
            expect(liquidity.model.market.trigger).toEqual(Trigger.RemoveLiquidity);
          });
      });
  });

  it("swap buys with the rewards contract", async () => {
    const [sender, emojis] = senderAndSymbols[6];
    const args = {
      inputAmount: 1234567n,
      minOutputAmount: 1n,
    };
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin.rewards.buy(sender, emojis, args).then(({ response, events, swap }) => {
      const { success } = response;
      const payload = response.payload as EntryFunctionPayloadResponse;
      expect(success).toBe(true);
      expect(payload.function).toEqual(functionNames.rewardsSwap);
      expect(events.chatEvents.length).toEqual(0);
      expect(events.globalStateEvents.length).toEqual(0);
      expect(events.liquidityEvents.length).toEqual(0);
      expect(events.periodicStateEvents.length).toEqual(0);
      expect(events.stateEvents.length).toEqual(1);
      expect(events.swapEvents.length).toEqual(1);
      expect(events.marketRegistrationEvents.length).toEqual(0);
      expect(swap.event.inputAmount).toEqual(args.inputAmount);
      expect(swap.event.isSell).toEqual(false);
      expect(swap.event.swapper).toEqual(sender.accountAddress.toString());
      expect(swap.event.integrator).toEqual(INTEGRATOR_ADDRESS.toString());
      expect(swap.event.integrator).not.toEqual(integrator.toString());
      expect(swap.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
      expect(swap.model.market.trigger).toEqual(Trigger.SwapBuy);
    });
  });
  it("swap sells with the rewards contract", async () => {
    const [sender, emojis] = senderAndSymbols[7];
    const args = {
      inputAmount: 1234567n,
      minOutputAmount: 1n,
    };
    await emojicoin.register(sender, emojis, { integrator }, gasOptions);
    await emojicoin.rewards.buy(sender, emojis, args);
    await emojicoin.rewards.sell(sender, emojis, args).then(({ response, events, swap }) => {
      const { success } = response;
      const payload = response.payload as EntryFunctionPayloadResponse;
      expect(success).toBe(true);
      expect(payload.function).toEqual(functionNames.rewardsSwap);
      expect(events.chatEvents.length).toEqual(0);
      expect(events.globalStateEvents.length).toEqual(0);
      expect(events.liquidityEvents.length).toEqual(0);
      expect(events.periodicStateEvents.length).toEqual(0);
      expect(events.stateEvents.length).toEqual(1);
      expect(events.swapEvents.length).toEqual(1);
      expect(events.marketRegistrationEvents.length).toEqual(0);
      expect(swap.event.inputAmount).toEqual(args.inputAmount);
      expect(swap.event.isSell).toEqual(true);
      expect(swap.event.swapper).toEqual(sender.accountAddress.toString());
      expect(swap.event.integrator).toEqual(INTEGRATOR_ADDRESS.toString());
      expect(swap.event.integrator).not.toEqual(integrator.toString());
      expect(swap.model.market.emojis.map(({ emoji }) => emoji)).toEqual(emojis);
      expect(swap.model.market.trigger).toEqual(Trigger.SwapSell);
    });
  });
});
