import {
  Account,
  InputGenerateTransactionOptions,
  WaitForTransactionOptions,
  UserTransactionResponse,
  AccountAddressInput,
  Aptos,
  HexInput,
  AccountAddress,
  TypeTag,
  Uint64,
} from "@aptos-labs/ts-sdk";
import { MarketSymbolEmojis, SymbolEmoji } from "../emoji_data/types";
import { getEvents } from "../emojicoin_dot_fun";
import {
  Chat,
  ProvideLiquidity,
  RemoveLiquidity,
  RegisterMarket,
  Swap,
  SwapWithRewards,
} from "../emojicoin_dot_fun/emojicoin-dot-fun";
import { Events } from "../emojicoin_dot_fun/events";
import { getEmojicoinMarketAddressAndTypeTags } from "../markets";
import { EventsModels, getEventsAsProcessorModelsFromResponse } from "../mini-processor";
import { getAptosClient } from "../utils/aptos-client";
import { getEmojisInString } from "../emoji_data";
import { Types } from "../types";

type Options = {
  feePayer?: Account;
  options?: InputGenerateTransactionOptions;
  waitForTransactionOptions?: WaitForTransactionOptions;
};

type TransactionResult = {
  response: UserTransactionResponse;
  events: Events;
  models: EventsModels;
};

type AnyEmoji = string;

type ExtraSwapArgs = {
  isSell: boolean;
  inputAmount: Uint64;
  minOutputAmount: Uint64;
  integrator: AccountAddressInput;
  integratorFeeRateBPs: number;
};

const expect = <T>(v: T | undefined): T => {
  if (typeof v === "undefined") {
    throw new Error("Expected to receive a non-undefined value.");
  }
  return v;
};

export class EmojicoinClient {
  public aptos: Aptos;

  public liquidity = {
    provide: this.provideLiquidity,
    remove: this.removeLiquidity,
  };

  public utils = {
    emojisToHexStrings: this.emojisToHexStrings,
    emojisToHexSymbol: this.emojisToHexSymbol,
    getEmojicoinInfo: this.getEmojicoinInfo,
    getEmojicoinData: this.getEmojicoinData,
  };

  public rewards = {
    buy: this.buyWithRewards,
    sell: this.sellWithRewards,
  };

  constructor(args?: { aptos?: Aptos }) {
    this.aptos = args?.aptos ?? getAptosClient().aptos;
  }

  async register(
    registrant: Account,
    emojis: MarketSymbolEmojis,
    args: {
      integrator: AccountAddressInput;
    },
    options?: Options
  ) {
    const response = await RegisterMarket.submit({
      aptosConfig: this.aptos.config,
      registrant,
      emojis: this.emojisToHexStrings(emojis),
      integrator: args.integrator,
      ...options,
    });
    const res = this.getEmojicoinData(response);
    return {
      ...res,
      registration: {
        event: expect(res.events.marketRegistrationEvents.at(0)),
        model: expect(res.models.marketRegistrationEvents.at(0)),
      },
    };
  }

  async chat(
    user: Account,
    emojis: SymbolEmoji[],
    args: {
      chatEmojis: AnyEmoji[];
      emojiIndicesSequence: number[];
    },
    options?: Options
  ) {
    const chatEmojis = getEmojisInString(args.chatEmojis.join("")) as SymbolEmoji[];
    const emojiBytes = this.emojisToHexStrings(chatEmojis);
    const emojiIndicesSequence = new Uint8Array(args.emojiIndicesSequence);

    const response = await Chat.submit({
      aptosConfig: this.aptos.config,
      user,
      emojiBytes,
      emojiIndicesSequence,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    const res = this.getEmojicoinData(response);
    return {
      ...res,
      chat: {
        event: expect(res.events.chatEvents.at(0)),
        model: expect(res.models.chatEvents.at(0)),
      },
    };
  }

  async buy(
    swapper: Account,
    emojis: SymbolEmoji[],
    args: {
      inputAmount: Uint64;
      minOutputAmount: Uint64;
      integrator: AccountAddressInput;
      integratorFeeRateBPs: number;
    },
    options?: Options
  ) {
    return await this.swap(swapper, emojis, { ...args, isSell: false }, options);
  }

  async sell(
    swapper: Account,
    emojis: SymbolEmoji[],
    args: {
      inputAmount: Uint64;
      minOutputAmount: Uint64;
      integrator: AccountAddressInput;
      integratorFeeRateBPs: number;
    },
    options?: Options
  ) {
    return await this.swap(swapper, emojis, { ...args, isSell: true }, options);
  }

  private async swap(
    swapper: Account,
    emojis: SymbolEmoji[],
    args: ExtraSwapArgs,
    options?: Options
  ) {
    const response = await Swap.submit({
      aptosConfig: this.aptos.config,
      swapper,
      ...args,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    const res = this.getEmojicoinData(response);
    return {
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0)),
        model: expect(res.models.swapEvents.at(0)),
      },
    };
  }

  private async buyWithRewards(
    swapper: Account,
    emojis: SymbolEmoji[],
    args: {
      inputAmount: Uint64;
      minOutputAmount: Uint64;
    },
    options?: Options
  ) {
    return await this.swapWithRewards(swapper, emojis, { ...args, isSell: false }, options);
  }

  private async sellWithRewards(
    swapper: Account,
    emojis: SymbolEmoji[],
    args: {
      inputAmount: Uint64;
      minOutputAmount: Uint64;
    },
    options?: Options
  ) {
    return await this.swapWithRewards(swapper, emojis, { ...args, isSell: true }, options);
  }

  private async swapWithRewards(
    swapper: Account,
    emojis: SymbolEmoji[],
    args: Omit<ExtraSwapArgs, "integrator" | "integratorFeeRateBPs">,
    options?: Options
  ) {
    const response = await SwapWithRewards.submit({
      aptosConfig: this.aptos.config,
      swapper,
      ...args,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    const res = this.getEmojicoinData(response);
    return {
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0)),
        model: expect(res.models.swapEvents.at(0)),
      },
    };
  }

  private async provideLiquidity({
    provider,
    emojis,
    args,
    options = {},
  }: {
    provider: Account;
    emojis: SymbolEmoji[];
    args: {
      quoteAmount: Uint64;
      minLpCoinsOut: Uint64;
    };
    options?: Options;
  }) {
    const response = await ProvideLiquidity.submit({
      aptosConfig: this.aptos.config,
      provider,
      ...args,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    const res = this.getEmojicoinData(response);
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0)),
        model: expect(res.models.liquidityEvents.at(0)),
      },
    };
  }

  private async removeLiquidity({
    provider,
    emojis,
    args,
    options = {},
  }: {
    provider: Account;
    emojis: SymbolEmoji[];
    args: {
      lpCoinAmount: Uint64;
      minQuoteOut: Uint64;
    };
    options?: Options;
  }) {
    const response = await RemoveLiquidity.submit({
      aptosConfig: this.aptos.config,
      provider,
      ...args,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    const res = this.getEmojicoinData(response);
    return {
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0)),
        model: expect(res.models.liquidityEvents.at(0)),
      },
    };
  }

  private emojisToHexStrings(emojis: SymbolEmoji[]): HexInput[] {
    return emojis.map((emoji) => new TextEncoder().encode(emoji));
  }

  private emojisToHexSymbol(emojis: SymbolEmoji[]): HexInput {
    const res = emojis.flatMap((emoji) => Array.from(new TextEncoder().encode(emoji)));
    return new Uint8Array(res);
  }

  private getEmojicoinInfo(emojis: SymbolEmoji[]): {
    marketAddress: AccountAddress;
    typeTags: [TypeTag, TypeTag];
  } {
    const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: this.emojisToHexSymbol(emojis),
    });
    return {
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
    };
  }

  private getEmojicoinData(response: UserTransactionResponse): TransactionResult {
    const events = getEvents(response);
    const models = getEventsAsProcessorModelsFromResponse(response, events);
    return {
      response,
      events,
      models,
    };
  }
}
