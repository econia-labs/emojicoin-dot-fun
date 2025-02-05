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
  type LedgerVersionArg,
} from "@aptos-labs/ts-sdk";
import { type ChatEmoji, type SymbolEmoji } from "../emoji_data/types";
import { EmojicoinArena, EmojicoinDotFun, getEvents } from "../emojicoin_dot_fun";
import {
  Chat,
  ProvideLiquidity,
  RemoveLiquidity,
  RegisterMarket,
  Swap,
  SwapWithRewards,
} from "@/contract-apis/emojicoin-dot-fun";
import { type Events } from "../emojicoin_dot_fun/events";
import { getEmojicoinMarketAddressAndTypeTags } from "../markets";
import { type EventsModels, getEventsAsProcessorModelsFromResponse } from "../indexer-v2";
import { APTOS_CONFIG, getAptosClient } from "../utils/aptos-client";
import { toChatMessageEntryFunctionArgs } from "../emoji_data";
import customExpect from "./expect";
import { DEFAULT_REGISTER_MARKET_GAS_OPTIONS, INTEGRATOR_ADDRESS } from "../const";
import { waitFor } from "../utils";
import { postgrest } from "../indexer-v2/queries";
import { TableName } from "../indexer-v2/types/json-types";
import { toMarketView, toRegistryView, toSwapEvent, type AnyNumberString } from "../types";
import { toArenaCoinTypes } from "../markets/arena-utils";
import { type ArenaEvents } from "../emojicoin_dot_fun/arena-events";
import {
  type ArenaEventsModels,
  getArenaEventsAsProcessorModels,
} from "../indexer-v2/mini-processor/arena-events-to-models";

const { expect, Expect } = customExpect;

type Options = {
  feePayer?: Account;
  options?: InputGenerateTransactionOptions;
  waitForTransactionOptions?: WaitForTransactionOptions;
};

const waitForEmojicoinEventProcessed = async (
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

async function waitForArenaEventProcessed(
  transactionVersion: AnyNumberString,
  eventIndex: AnyNumberString,
  tableName: TableName.ArenaMeleeEvents,
  meleeID: bigint
): Promise<boolean>;
async function waitForArenaEventProcessed(
  transactionVersion: AnyNumberString,
  eventIndex: AnyNumberString,
  tableName: TableName.ArenaEnterEvents | TableName.ArenaExitEvents | TableName.ArenaSwapEvents
): Promise<boolean>;
async function waitForArenaEventProcessed(
  transactionVersion: AnyNumberString,
  eventIndex: AnyNumberString,
  tableName:
    | TableName.ArenaMeleeEvents
    | TableName.ArenaEnterEvents
    | TableName.ArenaExitEvents
    | TableName.ArenaSwapEvents,
  meleeID?: bigint
) {
  return waitFor({
    condition: async () => {
      const data =
        tableName === TableName.ArenaMeleeEvents
          ? await postgrest.from(tableName).select("*").eq("melee_id", meleeID)
          : await postgrest
              .from(tableName)
              .select("*")
              .eq("transaction_version", transactionVersion)
              .eq("event_index", Number(eventIndex));
      return data.error === null && data.data?.length === 1;
    },
    interval: 500,
    maxWaitTime: 30000,
    errorMessage: "Arena event did not register on time.",
  });
}

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
 * @param alwaysWaitForIndexer whether or not each transaction should wait for the indexer to
 * process the event before returning.
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

  public register = this.registerInternal.bind(this);
  public chat = this.chatInternal.bind(this);
  public buy = this.buyInternal.bind(this);
  public sell = this.sellInternal.bind(this);

  public liquidity = {
    provide: this.provideLiquidity.bind(this),
    remove: this.removeLiquidity.bind(this),
  };

  public arena: {
    enter: typeof EmojicoinClient.prototype.arenaEnter;
    exit: typeof EmojicoinClient.prototype.arenaExit;
    swap: typeof EmojicoinClient.prototype.arenaSwap;
  } = {
    enter: this.arenaEnter.bind(this),
    exit: this.arenaExit.bind(this),
    swap: this.arenaSwap.bind(this),
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
    registry: typeof EmojicoinClient.prototype.registryView;
    market: typeof EmojicoinClient.prototype.marketView;
  } = {
    marketExists: this.isMarketRegisteredView.bind(this),
    simulateBuy: this.simulateBuy.bind(this),
    simulateSell: this.simulateSell.bind(this),
    registry: this.registryView.bind(this),
    market: this.marketView.bind(this),
  };

  private alwaysWaitForIndexer: boolean;

  private integrator: AccountAddress;

  private integratorFeeRateBPs: number;

  private minOutputAmount: bigint;

  constructor(args?: {
    aptos?: Aptos;
    aptosApiKey?: string;
    integrator?: AccountAddressInput;
    integratorFeeRateBPs?: bigint | number;
    minOutputAmount?: bigint | number;
    alwaysWaitForIndexer?: boolean;
  }) {
    const {
      aptos = getAptosClient(),
      integrator = INTEGRATOR_ADDRESS,
      integratorFeeRateBPs = 0,
      minOutputAmount = 1n,
      alwaysWaitForIndexer = false,
      aptosApiKey,
    } = args ?? {};
    const clientConfig = {
      ...aptos.config.clientConfig,
      // If the Aptos API key is passed in, use it, otherwise, use the default one set by
      // environment variables.
      ...(aptosApiKey
        ? {
            API_KEY: aptosApiKey,
          }
        : APTOS_CONFIG),
    };
    // Create a client that always uses the static API_KEY config options.
    const aptosConfig = new AptosConfig({
      ...aptos.config,
      clientConfig,
    });
    this.aptos = new Aptos(aptosConfig);
    this.integrator = AccountAddress.from(integrator);
    this.integratorFeeRateBPs = Number(integratorFeeRateBPs);
    this.minOutputAmount = BigInt(minOutputAmount);
    this.alwaysWaitForIndexer = alwaysWaitForIndexer;
  }

  // Internal so we can bind the public functions.
  private async registerInternal(
    registrant: Account,
    symbolEmojis: SymbolEmoji[],
    transactionOptions?: Options
  ) {
    const { feePayer, waitForTransactionOptions, options } = transactionOptions ?? {};
    const response = await RegisterMarket.submit({
      aptosConfig: this.aptos.config,
      registrant,
      emojis: this.emojisToHexStrings(symbolEmojis),
      integrator: this.integrator,
      options: {
        ...DEFAULT_REGISTER_MARKET_GAS_OPTIONS,
        ...options,
      },
      feePayer,
      waitForTransactionOptions,
    });
    const res = this.getTransactionEventData(response);
    const marketID = res.events.marketRegistrationEvents[0].marketID;
    if (this.alwaysWaitForIndexer) {
      await waitForEmojicoinEventProcessed(marketID, 1n, TableName.MarketRegistrationEvents);
    }
    return {
      ...res,
      registration: {
        event: expect(res.events.marketRegistrationEvents.at(0), Expect.Register.Event),
        model: expect(res.models.marketRegistrationEvents.at(0), Expect.Register.Model),
      },
    };
  }

  // Internal so we can bind the public functions.
  private async chatInternal(
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
    if (this.alwaysWaitForIndexer) {
      await waitForEmojicoinEventProcessed(marketID, emitMarketNonce, TableName.ChatEvents);
    }
    return {
      ...res,
      chat: {
        event: expect(res.events.chatEvents.at(0), Expect.Chat.Event),
        model: expect(res.models.chatEvents.at(0), Expect.Chat.Model),
      },
    };
  }

  // Internal so we can bind the public functions.
  private async buyInternal(
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

  // Internal so we can bind the public functions.
  private async sellInternal(
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

  private async registryView(options?: LedgerVersionArg) {
    return await EmojicoinDotFun.RegistryView.view({
      aptos: this.aptos,
      options,
    }).then(toRegistryView);
  }

  private async marketView(marketAddress: AccountAddressInput, options?: LedgerVersionArg) {
    return await EmojicoinDotFun.MarketView.view({
      marketAddress,
      aptos: this.aptos,
      options,
    }).then(toMarketView);
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
    if (this.alwaysWaitForIndexer) {
      await waitForEmojicoinEventProcessed(marketID, marketNonce, TableName.SwapEvents);
    }
    return {
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0), Expect.Swap.Event),
        model: expect(res.models.swapEvents.at(0), Expect.Swap.Model),
      },
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
    if (this.alwaysWaitForIndexer) {
      await waitForEmojicoinEventProcessed(marketID, marketNonce, TableName.SwapEvents);
    }
    return {
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0), Expect.Swap.Event),
        model: expect(res.models.swapEvents.at(0), Expect.Swap.Model),
      },
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
    if (this.alwaysWaitForIndexer) {
      await waitForEmojicoinEventProcessed(marketID, marketNonce, TableName.LiquidityEvents);
    }
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0), Expect.Liquidity.Event),
        model: expect(res.models.liquidityEvents.at(0), Expect.Liquidity.Model),
      },
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
    if (this.alwaysWaitForIndexer) {
      await waitForEmojicoinEventProcessed(marketID, marketNonce, TableName.LiquidityEvents);
    }
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0), Expect.Liquidity.Event),
        model: expect(res.models.liquidityEvents.at(0), Expect.Liquidity.Model),
      },
    };
  }

  private async arenaSwap(
    swapper: Account,
    symbol1: SymbolEmoji[],
    symbol2: SymbolEmoji[],
    options?: Options
  ) {
    const typeTags = toArenaCoinTypes({ symbol1, symbol2 });
    const response = await EmojicoinArena.Swap.submit({
      aptosConfig: this.aptos.config,
      swapper,
      typeTags,
      ...options,
    });
    const res = this.getTransactionEventData(response);
    const { version, eventIndex } = res.events.arenaSwapEvents[0];
    if (this.alwaysWaitForIndexer) {
      await waitForArenaEventProcessed(version, eventIndex, TableName.ArenaSwapEvents);
    }
    return {
      ...res,
      arena: {
        event: expect(res.models.arenaSwapEvents.at(0), Expect.ArenaSwap.Event),
        model: expect(res.events.arenaSwapEvents.at(0), Expect.ArenaSwap.Model),
      },
    };
  }

  private async arenaEnter(
    entrant: Account,
    inputAmount: bigint,
    lockIn: boolean,
    symbol1: SymbolEmoji[],
    symbol2: SymbolEmoji[],
    escrowCoin: "symbol1" | "symbol2",
    options?: Options
  ) {
    const typeTags = toArenaCoinTypes({ symbol1, symbol2 });
    const escrowType = escrowCoin === "symbol1" ? typeTags[0] : typeTags[2];
    const response = await EmojicoinArena.Enter.submit({
      aptosConfig: this.aptos.config,
      entrant,
      inputAmount,
      lockIn,
      typeTags: [...typeTags, escrowType],
      ...options,
    });
    const res = this.getTransactionEventData(response);
    const { version, eventIndex } = res.events.arenaEnterEvents[0];
    if (this.alwaysWaitForIndexer) {
      await waitForArenaEventProcessed(version, eventIndex, TableName.ArenaEnterEvents);
    }
    return {
      ...res,
      arena: {
        event: expect(res.models.arenaEnterEvents.at(0), Expect.ArenaEnter.Event),
        model: expect(res.events.arenaEnterEvents.at(0), Expect.ArenaEnter.Model),
      },
    };
    // const { meleeID, version, eventIndex } =
  }

  private async arenaExit(
    participant: Account,
    symbol1: SymbolEmoji[],
    symbol2: SymbolEmoji[],
    options?: Options
  ) {
    const typeTags = toArenaCoinTypes({ symbol1, symbol2 });
    const response = await EmojicoinArena.Exit.submit({
      aptosConfig: this.aptos.config,
      participant,
      typeTags,
      ...options,
    });
    const res = this.getTransactionEventData(response);
    const { version, eventIndex } = res.events.arenaExitEvents[0];
    if (this.alwaysWaitForIndexer) {
      await waitForArenaEventProcessed(version, eventIndex, TableName.ArenaExitEvents);
    }
    return {
      ...res,
      arena: {
        event: expect(res.models.arenaExitEvents.at(0), Expect.ArenaExit.Event),
        model: expect(res.events.arenaExitEvents.at(0), Expect.ArenaExit.Model),
      },
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
    events: Events & ArenaEvents;
    models: EventsModels & ArenaEventsModels;
  } {
    const events = getEvents(response);
    const models = {
      ...getEventsAsProcessorModelsFromResponse(response, events),
      ...getArenaEventsAsProcessorModels(response),
    };
    return {
      response,
      events,
      models,
    };
  }
}
