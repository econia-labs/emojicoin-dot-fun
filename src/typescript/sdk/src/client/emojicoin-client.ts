import {
  AccountAddress,
  Aptos,
  type Account,
  type UserTransactionResponse,
  type AccountAddressInput,
  type TypeTag,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  AptosConfig,
} from "@aptos-labs/ts-sdk";
import { type ChatEmoji, type SymbolEmoji } from "../emoji_data/types";
import { EmojicoinDotFun, getEvents } from "../emojicoin_dot_fun";
import {
  Chat,
  ProvideLiquidity,
  RemoveLiquidity,
  RegisterMarket,
  Swap,
  SwapWithRewards,
} from "../emojicoin_dot_fun/emojicoin-dot-fun";
import { type Events } from "../emojicoin_dot_fun/events";
import { getEmojicoinMarketAddressAndTypeTags } from "../markets";
import { type EventsModels, getEventsAsProcessorModelsFromResponse } from "../mini-processor";
import { APTOS_CONFIG, getAptosClient } from "../utils/aptos-client";
import { toChatMessageEntryFunctionArgs } from "../emoji_data";
import customExpect from "./expect";
import { DEFAULT_REGISTER_MARKET_GAS_OPTIONS, INTEGRATOR_ADDRESS } from "../const";
import { waitFor } from "../utils";
import { postgrest } from "../indexer-v2/queries";
import { TableName } from "../indexer-v2/types/json-types";
import { toSwapEvent, type AnyNumberString } from "../types";

const { expect, Expect } = customExpect;

type Options = {
  feePayer?: Account;
  options?: InputGenerateTransactionOptions;
  waitForTransactionOptions?: WaitForTransactionOptions;
};

const waitForEventProcessed = async (
  marketID: bigint,
  marketNonce: bigint,
  tableName: TableName
) => {
  return waitFor({
    condition: async () => {
      const data = await postgrest
        .from(tableName)
        .select("*")
        .eq("market_id", marketID)
        .eq("market_nonce", marketNonce);
      return data.error === null && data.data?.length === 1;
    },
    interval: 500,
    maxWaitTime: 30000,
    throwError: true,
    errorMessage: "Event did not register on time.",
  });
};

/**
 * A helper class intended to streamline the process of submitting transactions and using utility
 * functions for emojis and market symbols.
 *
 * The class is created with an optional `Aptos` client, defaulting to creating an `Aptos` client
 * from the current network in the environment variables.
 *
 * Each transaction submission automatically parses the event data and sorts it into corresponding
 * events and models, offering an easy way to extract the most relevant event data- i.e., the
 * RegisterMarket event for `register`ing a market, or the `Swap` event for `swap`ping.
 *
 * The `swap` function is separated into `buy` and `sell` to reduce the amount of input arguments.
 *
 * The `provide_liquidity` and `remove_liquidity` functions in the contract are both under
 * `liquidity` as `provide` and `remove`, respectively.
 *
 * The `utils` functions provides several commonly used utility functions.
 *
 * @example
 * ```typescript
 * const emojis: MarketSymbolEmojis = ["🌊"];
 * const emojicoin = new EmojicoinClient();
 * const account = Account.generate();
 * const integrator = account.accountAddress;
 * await emojicoin.register(account, emojis, { integrator });
 * const buyArgs = {
 *  inputAmount: 100n,
 *  minOutputAmount: 1n,
 *  integrator,
 *  integratorFeeRateBPs: 0,
 * };
 * await emojicoin.buy(account, emojis, buyArgs);
 * ```
 */
export class EmojicoinClient {
  public aptos: Aptos;

  public liquidity = {
    provide: this.provideLiquidity.bind(this),
    remove: this.removeLiquidity.bind(this),
  };

  public utils: {
    emojisToHexStrings: typeof EmojicoinClient.prototype.emojisToHexStrings;
    emojisToHexSymbol: typeof EmojicoinClient.prototype.emojisToHexSymbol;
    getEmojicoinInfo: typeof EmojicoinClient.prototype.getEmojicoinInfo;
    getTransactionEventData: typeof EmojicoinClient.prototype.getTransactionEventData;
  } = {
    emojisToHexStrings: this.emojisToHexStrings.bind(this),
    emojisToHexSymbol: this.emojisToHexSymbol.bind(this),
    getEmojicoinInfo: this.getEmojicoinInfo.bind(this),
    getTransactionEventData: this.getTransactionEventData.bind(this),
  };

  public rewards: {
    buy: typeof EmojicoinClient.prototype.buyWithRewards;
    sell: typeof EmojicoinClient.prototype.sellWithRewards;
  } = {
    buy: this.buyWithRewards.bind(this),
    sell: this.sellWithRewards.bind(this),
  };

  public view: {
    marketExists: typeof EmojicoinClient.prototype.isMarketRegisteredView;
    simulateBuy: typeof EmojicoinClient.prototype.simulateBuy;
    simulateSell: typeof EmojicoinClient.prototype.simulateSell;
  } = {
    marketExists: this.isMarketRegisteredView.bind(this),
    simulateBuy: this.simulateBuy.bind(this),
    simulateSell: this.simulateSell.bind(this),
  };

  private integrator: AccountAddress;

  private integratorFeeRateBPs: number;

  private minOutputAmount: bigint;

  constructor(args?: {
    aptos?: Aptos;
    integrator?: AccountAddressInput;
    integratorFeeRateBPs?: bigint | number;
    minOutputAmount?: bigint | number;
  }) {
    const {
      aptos = getAptosClient(),
      integrator = INTEGRATOR_ADDRESS,
      integratorFeeRateBPs = 0,
      minOutputAmount = 1n,
    } = args ?? {};
    // Create a client that always uses the static API_KEY config options.
    const hardCodedConfig = new AptosConfig({
      ...aptos.config,
      clientConfig: { ...aptos.config.clientConfig, ...APTOS_CONFIG },
    });
    this.aptos = new Aptos(hardCodedConfig);
    this.integrator = AccountAddress.from(integrator);
    this.integratorFeeRateBPs = Number(integratorFeeRateBPs);
    this.minOutputAmount = BigInt(minOutputAmount);
  }

  async register(registrant: Account, symbolEmojis: SymbolEmoji[], options?: Options) {
    const response = await RegisterMarket.submit({
      aptosConfig: this.aptos.config,
      registrant,
      emojis: this.emojisToHexStrings(symbolEmojis),
      integrator: this.integrator,
      options: DEFAULT_REGISTER_MARKET_GAS_OPTIONS,
      ...options,
    });
    const res = this.getTransactionEventData(response);
    const marketID = res.events.marketRegistrationEvents[0].marketID;
    return {
      ...res,
      registration: {
        event: expect(res.events.marketRegistrationEvents.at(0), Expect.Register.Event),
        model: expect(res.models.marketRegistrationEvents.at(0), Expect.Register.Model),
      },
      handle: waitForEventProcessed(marketID, 1n, TableName.MarketRegistrationEvents),
    };
  }

  async chat(
    user: Account,
    symbolEmojis: SymbolEmoji[],
    message: string | (SymbolEmoji | ChatEmoji)[],
    options?: Options
  ) {
    const { emojiBytes, emojiIndicesSequence } =
      typeof message === "string"
        ? toChatMessageEntryFunctionArgs(message)
        : toChatMessageEntryFunctionArgs(message.join(""));

    const response = await Chat.submit({
      aptosConfig: this.aptos.config,
      user,
      emojiBytes,
      emojiIndicesSequence,
      ...options,
      ...this.getEmojicoinInfo(symbolEmojis),
    });
    const res = this.getTransactionEventData(response);
    const { emitMarketNonce, marketID } = res.events.chatEvents[0];
    return {
      ...res,
      chat: {
        event: expect(res.events.chatEvents.at(0), Expect.Chat.Event),
        model: expect(res.models.chatEvents.at(0), Expect.Chat.Model),
      },
      handle: waitForEventProcessed(marketID, emitMarketNonce, TableName.ChatEvents),
    };
  }

  async buy(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    inputAmount: bigint | number,
    options?: Options
  ) {
    return await this.swap(
      swapper,
      symbolEmojis,
      {
        inputAmount,
        integrator: this.integrator,
        integratorFeeRateBPs: this.integratorFeeRateBPs,
        minOutputAmount: this.minOutputAmount,
        isSell: false,
      },
      options
    );
  }

  async sell(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    inputAmount: bigint | number,
    options?: Options
  ) {
    return await this.swap(
      swapper,
      symbolEmojis,
      {
        inputAmount,
        integrator: this.integrator,
        integratorFeeRateBPs: this.integratorFeeRateBPs,
        minOutputAmount: this.minOutputAmount,
        isSell: true,
      },
      options
    );
  }

  private async simulateBuy(args: {
    symbolEmojis: SymbolEmoji[];
    swapper: AccountAddressInput;
    inputAmount: AnyNumberString;
    ledgerVersion?: number | bigint;
  }) {
    return await this.simulateSwap({ ...args, isSell: false });
  }

  private async simulateSell(args: {
    symbolEmojis: SymbolEmoji[];
    swapper: AccountAddressInput;
    inputAmount: AnyNumberString;
    ledgerVersion?: number | bigint;
  }) {
    return await this.simulateSwap({ ...args, isSell: true });
  }

  private async simulateSwap(args: {
    symbolEmojis: SymbolEmoji[];
    swapper: AccountAddressInput;
    inputAmount: AnyNumberString;
    isSell: boolean;
    ledgerVersion?: number | bigint;
  }) {
    const { symbolEmojis, swapper, inputAmount, isSell, ledgerVersion } = args;
    const { marketAddress, typeTags } = this.getEmojicoinInfo(symbolEmojis);
    const res = await EmojicoinDotFun.SimulateSwap.view({
      aptos: this.aptos,
      swapper,
      marketAddress,
      inputAmount: BigInt(inputAmount),
      isSell,
      integrator: this.integrator,
      integratorFeeRateBPs: this.integratorFeeRateBPs,
      typeTags,
      options: {
        ledgerVersion,
      },
    });
    return toSwapEvent(res, -1);
  }

  private async isMarketRegisteredView(
    symbolEmojis: SymbolEmoji[],
    ledgerVersion?: AnyNumberString
  ) {
    const { marketAddress } = this.getEmojicoinInfo(symbolEmojis);
    const res = await EmojicoinDotFun.MarketMetadataByMarketAddress.view({
      aptos: this.aptos,
      marketAddress,
      ...(ledgerVersion ? { options: { ledgerVersion: BigInt(ledgerVersion) } } : {}),
    });
    return typeof res.vec.pop() !== "undefined";
  }

  private async swap(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    args: {
      isSell: boolean;
      inputAmount: bigint | number;
      minOutputAmount: bigint | number;
      integrator: AccountAddressInput;
      integratorFeeRateBPs: number;
    },
    options?: Options
  ) {
    const response = await Swap.submit({
      aptosConfig: this.aptos.config,
      swapper,
      ...args,
      ...options,
      ...this.getEmojicoinInfo(symbolEmojis),
    });
    const res = this.getTransactionEventData(response);
    const { marketNonce, marketID } = res.events.swapEvents[0];
    return {
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0), Expect.Swap.Event),
        model: expect(res.models.swapEvents.at(0), Expect.Swap.Model),
      },
      handle: waitForEventProcessed(marketID, marketNonce, TableName.SwapEvents),
    };
  }

  private async buyWithRewards(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    inputAmount: bigint | number,
    options?: Options
  ) {
    return await this.swapWithRewards(
      swapper,
      symbolEmojis,
      { inputAmount, minOutputAmount: this.minOutputAmount, isSell: false },
      options
    );
  }

  private async sellWithRewards(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    inputAmount: bigint | number,
    options?: Options
  ) {
    return await this.swapWithRewards(
      swapper,
      symbolEmojis,
      { inputAmount, minOutputAmount: this.minOutputAmount, isSell: true },
      options
    );
  }

  private async swapWithRewards(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    args: {
      isSell: boolean;
      inputAmount: bigint | number;
      minOutputAmount: bigint | number;
    },
    options?: Options
  ) {
    const response = await SwapWithRewards.submit({
      aptosConfig: this.aptos.config,
      swapper,
      ...args,
      ...options,
      ...this.getEmojicoinInfo(symbolEmojis),
    });
    const res = this.getTransactionEventData(response);
    const { marketNonce, marketID } = res.events.swapEvents[0];
    return {
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0), Expect.Swap.Event),
        model: expect(res.models.swapEvents.at(0), Expect.Swap.Model),
      },
      handle: waitForEventProcessed(marketID, marketNonce, TableName.SwapEvents),
    };
  }

  private async provideLiquidity(
    provider: Account,
    symbolEmojis: SymbolEmoji[],
    quoteAmount: bigint | number,
    options?: Options
  ) {
    const response = await ProvideLiquidity.submit({
      aptosConfig: this.aptos.config,
      provider,
      quoteAmount,
      minLpCoinsOut: this.minOutputAmount,
      ...options,
      ...this.getEmojicoinInfo(symbolEmojis),
    });
    const res = this.getTransactionEventData(response);
    const { marketNonce, marketID } = res.events.liquidityEvents[0];
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0), Expect.Liquidity.Event),
        model: expect(res.models.liquidityEvents.at(0), Expect.Liquidity.Model),
      },
      handle: waitForEventProcessed(marketID, marketNonce, TableName.LiquidityEvents),
    };
  }

  private async removeLiquidity(
    provider: Account,
    symbolEmojis: SymbolEmoji[],
    lpCoinAmount: bigint | number,
    options?: Options
  ) {
    const response = await RemoveLiquidity.submit({
      aptosConfig: this.aptos.config,
      provider,
      lpCoinAmount,
      minQuoteOut: this.minOutputAmount,
      ...options,
      ...this.getEmojicoinInfo(symbolEmojis),
    });
    const res = this.getTransactionEventData(response);
    const { marketNonce, marketID } = res.events.liquidityEvents[0];
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0), Expect.Liquidity.Event),
        model: expect(res.models.liquidityEvents.at(0), Expect.Liquidity.Model),
      },
      handle: waitForEventProcessed(marketID, marketNonce, TableName.LiquidityEvents),
    };
  }

  private emojisToHexStrings(symbolEmojis: SymbolEmoji[]) {
    return symbolEmojis.map((emoji) => new TextEncoder().encode(emoji));
  }

  private emojisToHexSymbol(symbolEmojis: SymbolEmoji[]) {
    const res = symbolEmojis.flatMap((emoji) => Array.from(new TextEncoder().encode(emoji)));
    return new Uint8Array(res);
  }

  private getEmojicoinInfo(symbolEmojis: SymbolEmoji[]): {
    marketAddress: AccountAddress;
    typeTags: [TypeTag, TypeTag];
  } {
    const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: this.emojisToHexSymbol(symbolEmojis),
    });
    return {
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
    };
  }

  private getTransactionEventData(response: UserTransactionResponse): {
    response: UserTransactionResponse;
    events: Events;
    models: EventsModels;
  } {
    const events = getEvents(response);
    const models = getEventsAsProcessorModelsFromResponse(response, events);
    return {
      response,
      events,
      models,
    };
  }
}
