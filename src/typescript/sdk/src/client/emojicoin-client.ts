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
import { INTEGRATOR_ADDRESS } from "../const";
import { getRandomEmoji } from "../emoji_data/symbol-data";
import { SymbolEmoji } from "../emoji_data/types";
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

type Options = {
  feePayer?: Account;
  options?: InputGenerateTransactionOptions;
  waitForTransactionOptions?: WaitForTransactionOptions;
};

export const DEFAULT_INPUT_AMOUNT = 100n;
export const DEFAULT_MIN_OUTPUT_AMOUNT = 1n;
export const DEFAULT_INTEGRATOR = INTEGRATOR_ADDRESS;
export const DEFAULT_INTEGRATOR_FEE_RATE_BPS = 0;

type SubmitArgs<
  T extends
    | typeof Chat
    | typeof ProvideLiquidity
    | typeof RemoveLiquidity
    | typeof RegisterMarket
    | typeof Swap
    | typeof SwapWithRewards,
> = Partial<
  Omit<Parameters<T["submit"]>["0"], "swapper" | "provider" | "user" | "registrant" | "emojis">
>;

type TransactionResult = {
  response: UserTransactionResponse;
  events: Events;
  models: EventsModels;
};

type DefaultArgs = {
  integrator: AccountAddressInput;
  swap: {
    inputAmount: Uint64;
    minOutputAmount: Uint64;
    integratorFeeRateBPs: number;
  };
  liquidity: {
    quoteAmount: Uint64;
    minLpCoinsOut: Uint64;
    lpCoinAmount: Uint64;
    minQuoteOut: Uint64;
  };
};

type PartialDefaults = {
  integrator?: AccountAddressInput;
  swap?: Partial<DefaultArgs["swap"]>;
  liquidity?: Partial<DefaultArgs["liquidity"]>;
};

export class EmojicoinClient {
  public aptos: Aptos;

  public liquidity = {
    provide: this.provideLiquidityWithExpect,
    remove: this.removeLiquidityWithExpect,
  };

  public utils = {
    emojisToHexStrings: this.emojisToHexStrings,
    emojisToHexSymbol: this.emojisToHexSymbol,
    getEmojicoinInfo: this.getEmojicoinInfo,
    getEmojicoinData: this.getEmojicoinData,
  };

  private defaults: DefaultArgs;

  constructor(args?: { aptos?: Aptos; customDefaults?: PartialDefaults }) {
    const { aptos = getAptosClient().aptos, customDefaults } = args ?? {};
    this.aptos = aptos;
    this.defaults = initializeDefaults(customDefaults);
  }

  async register(args: Parameters<typeof this.registerMarket>["0"]) {
    return this.registerMarket(args).then((res) => ({
      ...res,
      registration: {
        event: expect(res.events.marketRegistrationEvents.at(0)),
        model: expect(res.models.marketRegistrationEvents.at(0)),
      },
    }));
  }

  async buy(submitArgs: Parameters<typeof this.swap>["0"]) {
    return this.swap({
      ...submitArgs,
      args: {
        isSell: false,
      },
    }).then((res) => ({
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0)),
        model: expect(res.models.swapEvents.at(0)),
      },
    }));
  }

  async sell(submitArgs: Parameters<typeof this.swap>["0"]) {
    return this.swap({
      ...submitArgs,
      args: {
        isSell: true,
      },
    }).then((res) => ({
      ...res,
      swap: {
        event: expect(res.events.swapEvents.at(0)),
        model: expect(res.models.swapEvents.at(0)),
      },
    }));
  }

  private async provideLiquidityWithExpect(args: Parameters<typeof this.provideLiquidity>["0"]) {
    return this.provideLiquidity(args).then((res) => ({
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0)),
        model: expect(res.models.liquidityEvents.at(0)),
      },
    }));
  }

  private async removeLiquidityWithExpect(args: Parameters<typeof this.removeLiquidity>["0"]) {
    return this.removeLiquidity(args).then((res) => ({
      ...res,
      liquidity: {
        event: expect(res.events.liquidityEvents.at(0)),
        model: expect(res.models.liquidityEvents.at(0)),
      },
    }));
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

  private async registerMarket({
    registrant,
    emojis,
    args,
    options = {},
  }: {
    registrant: Account;
    emojis: SymbolEmoji[];
    args: SubmitArgs<typeof RegisterMarket>;
    options?: Options;
  }): Promise<TransactionResult> {
    const response = await RegisterMarket.submit({
      aptosConfig: this.aptos.config,
      registrant,
      emojis: this.emojisToHexStrings(emojis),
      integrator: safeDefault(args.integrator, this.defaults.integrator),
      ...options,
    });
    return this.getEmojicoinData(response);
  }

  private async swap({
    swapper,
    emojis,
    args,
    options = {},
  }: {
    swapper: Account;
    emojis: SymbolEmoji[];
    args: SubmitArgs<typeof Swap>;
    options?: Options;
  }): Promise<TransactionResult> {
    const defaults = this.defaults.swap;
    const {
      inputAmount = safeDefault(args.inputAmount, defaults.inputAmount),
      minOutputAmount = safeDefault(args.minOutputAmount, defaults.minOutputAmount),
      integratorFeeRateBPs = safeDefault(args.integratorFeeRateBPs, defaults.integratorFeeRateBPs),
      integrator = safeDefault(args.integrator, this.defaults.integrator),
      isSell = safeDefault(args.isSell, false),
    } = args;

    const response = await Swap.submit({
      aptosConfig: this.aptos.config,
      swapper,
      isSell,
      inputAmount,
      minOutputAmount,
      integrator,
      integratorFeeRateBPs,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    return this.getEmojicoinData(response);
  }

  private async provideLiquidity({
    provider,
    emojis,
    args,
    options = {},
  }: {
    provider: Account;
    emojis: SymbolEmoji[];
    args: SubmitArgs<typeof ProvideLiquidity>;
    options: Options;
  }): Promise<TransactionResult> {
    const {
      quoteAmount = safeDefault(args.quoteAmount, this.defaults.liquidity.quoteAmount),
      minLpCoinsOut = safeDefault(args.minLpCoinsOut, this.defaults.liquidity.minLpCoinsOut),
    } = args;
    const response = await ProvideLiquidity.submit({
      aptosConfig: this.aptos.config,
      provider,
      quoteAmount,
      minLpCoinsOut,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    return this.getEmojicoinData(response);
  }

  private async removeLiquidity({
    provider,
    emojis,
    args,
    options = {},
  }: {
    provider: Account;
    emojis: SymbolEmoji[];
    args: SubmitArgs<typeof RemoveLiquidity>;
    options: Options;
  }): Promise<TransactionResult> {
    const {
      lpCoinAmount = safeDefault(args.lpCoinAmount, this.defaults.liquidity.lpCoinAmount),
      minQuoteOut = safeDefault(args.minQuoteOut, this.defaults.liquidity.minQuoteOut),
    } = args;
    const response = await RemoveLiquidity.submit({
      aptosConfig: this.aptos.config,
      provider,
      lpCoinAmount,
      minQuoteOut,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    return this.getEmojicoinData(response);
  }

  private async chat({
    user,
    emojis,
    args,
    options = {},
  }: {
    user: Account;
    emojis: SymbolEmoji[];
    args: SubmitArgs<typeof Chat>;
    options: Options;
  }): Promise<TransactionResult> {
    // Generate random chat emojis if they're not provided. Throw an error if we're in production.
    const [emojiBytes, emojiIndicesSequence] = (() => {
      const { emojiBytes, emojiIndicesSequence } = args;
      if (typeof emojiBytes === "undefined" || typeof emojiIndicesSequence === "undefined") {
        if (process.env.NODE_ENV !== "development") {
          throw new Error(`emojiBytes and emojiIndicesSequence can't be undefined in production.`);
        }
        const length = Math.random() * 9 + 1;
        const randomEmojis = Array.from({ length }).map(() => getRandomEmoji().bytes);
        const randomSequence = new Uint8Array(Array.from({ length }).map((_, i) => i));

        return [randomEmojis, randomSequence];
      } else {
        return [emojiBytes, emojiIndicesSequence];
      }
    })();

    const response = await Chat.submit({
      aptosConfig: this.aptos.config,
      user,
      emojiBytes,
      emojiIndicesSequence,
      ...options,
      ...this.getEmojicoinInfo(emojis),
    });
    return this.getEmojicoinData(response);
  }
}

const expect = <T>(v: T | undefined): T => {
  if (typeof v === "undefined") {
    throw new Error("Expected to receive event data.");
  }
  return v;
};

const safeDefault = <T>(v: T | undefined, defaultValue: T): T => {
  if (typeof v === "undefined" && process.env.NODE_ENV !== "development") {
    throw new Error(`This argument can't be undefined in a non-development environment.`);
  }
  return v ?? defaultValue;
};

const initializeDefaults = (customDefaults?: PartialDefaults): DefaultArgs => {
  const defaults: DefaultArgs = {
    integrator: DEFAULT_INTEGRATOR,
    swap: {
      inputAmount: DEFAULT_INPUT_AMOUNT,
      minOutputAmount: DEFAULT_MIN_OUTPUT_AMOUNT,
      integratorFeeRateBPs: DEFAULT_INTEGRATOR_FEE_RATE_BPS,
    },
    liquidity: {
      quoteAmount: DEFAULT_INPUT_AMOUNT,
      minLpCoinsOut: DEFAULT_MIN_OUTPUT_AMOUNT,
      lpCoinAmount: DEFAULT_INPUT_AMOUNT,
      minQuoteOut: DEFAULT_MIN_OUTPUT_AMOUNT,
    },
  };
  if (customDefaults) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(`You can't use default arguments in a non-development environment.`);
    }
    return {
      integrator: customDefaults.integrator ?? defaults.integrator,
      swap: {
        ...defaults.swap,
        ...customDefaults.swap,
      },
      liquidity: {
        ...defaults.liquidity,
        ...customDefaults.liquidity,
      },
    };
  } else {
    return defaults;
  }
};
