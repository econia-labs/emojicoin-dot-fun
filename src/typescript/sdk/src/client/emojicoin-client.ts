import {
  AccountAddress,
  type Account,
  type UserTransactionResponse,
  type AccountAddressInput,
  type Aptos,
  type TypeTag,
  type Uint64,
} from "@aptos-labs/ts-sdk";
import { type ChatEmoji, type SymbolEmoji } from "../emoji_data/types";
import { getEvents } from "../emojicoin_dot_fun";
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
import { getAptosClient } from "../utils/aptos-client";
import { toChatMessageEntryFunctionArgs } from "../emoji_data";
import customExpect from "./expect";
import type EmojicoinClientTypes from "./types";
import { INTEGRATOR_ADDRESS } from "../const";

const { expect, Expect } = customExpect;
type Options = EmojicoinClientTypes["Options"];
type ExtraSwapArgs = EmojicoinClientTypes["ExtraSwapArgs"];

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

  public utils = {
    emojisToHexStrings: this.emojisToHexStrings.bind(this),
    emojisToHexSymbol: this.emojisToHexSymbol.bind(this),
    getEmojicoinInfo: this.getEmojicoinInfo.bind(this),
    getTransactionEventData: this.getTransactionEventData.bind(this),
  };

  public rewards = {
    buy: this.buyWithRewards.bind(this),
    sell: this.sellWithRewards.bind(this),
  };

  public integrator: AccountAddress;

  public integratorFeeRateBPs: number;

  public minOutputAmount: bigint;

  constructor(args?: {
    aptos?: Aptos;
    integrator?: AccountAddressInput;
    integratorFeeRateBPs?: number;
    minOutputAmount?: bigint;
  }) {
    const {
      aptos = getAptosClient().aptos,
      integrator = INTEGRATOR_ADDRESS,
      integratorFeeRateBPs = 0,
      minOutputAmount = 1n,
    } = args ?? {};
    this.aptos = aptos;
    this.integrator = AccountAddress.from(integrator);
    this.integratorFeeRateBPs = integratorFeeRateBPs;
    this.minOutputAmount = minOutputAmount;
  }

  async register(registrant: Account, symbolEmojis: SymbolEmoji[], options?: Options) {
    const response = await RegisterMarket.submit({
      aptosConfig: this.aptos.config,
      registrant,
      emojis: this.emojisToHexStrings(symbolEmojis),
      integrator: this.integrator,
      ...options,
    });
    const res = this.getTransactionEventData(response);
    return {
      ...res,
      registration: {
        event: expect(res.events.marketRegistrationEvents.at(0), Expect.Register.Event),
        model: expect(res.models.marketRegistrationEvents.at(0), Expect.Register.Model),
      },
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
    return {
      ...res,
      chat: {
        event: expect(res.events.chatEvents.at(0), Expect.Chat.Event),
        model: expect(res.models.chatEvents.at(0), Expect.Chat.Model),
      },
    };
  }

  async buy(swapper: Account, symbolEmojis: SymbolEmoji[], inputAmount: Uint64, options?: Options) {
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
    inputAmount: Uint64,
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

  private async swap(
    swapper: Account,
    symbolEmojis: SymbolEmoji[],
    args: ExtraSwapArgs,
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
    inputAmount: Uint64,
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
    inputAmount: Uint64,
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
    args: Omit<ExtraSwapArgs, "integrator" | "integratorFeeRateBPs">,
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
    quoteAmount: Uint64,
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
    lpCoinAmount: Uint64,
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
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0), Expect.Liquidity.Event),
        model: expect(res.models.liquidityEvents.at(0), Expect.Liquidity.Model),
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
