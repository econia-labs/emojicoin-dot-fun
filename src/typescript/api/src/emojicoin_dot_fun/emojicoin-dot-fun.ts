/* eslint-disable max-classes-per-file */
/* eslint-disable max-len */
import {
  AccountAddress,
  MoveVector,
  type TypeTag,
  U64,
  U8,
  Bool,
  type Account,
  Aptos,
  type AptosConfig,
  type AccountAddressInput,
  type HexInput,
  parseTypeTag,
  buildTransaction,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  type UserTransactionResponse,
  type MoveValue,
  type LedgerVersionArg,
} from "@aptos-labs/ts-sdk";
import {
  type Option,
  type TypeTagInput,
  type Uint8,
  type Uint64,
  type AccountAddressString,
} from "./types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
} from "./payload-builders";
import { MODULE_ADDRESS } from "./consts";

export type ChatPayloadMoveArguments = {
  emojiBytes: MoveVector<MoveVector<U8>>;
  emojiIndicesSequence: MoveVector<U8>;
  marketAddress: AccountAddress;
};

/**
 *```
 *  public entry fun chat<Emojicoin, EmojicoinLP>(
 *     user: &signer,
 *     emoji_bytes: vector<vector<u8>>,
 *     emoji_indices_sequence: vector<u8>,
 *     market_address: address,
 *  )
 *```
 * */

export class Chat extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "chat";

  public readonly args: ChatPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    user: AccountAddressInput; // &signer
    emojiBytes: Array<HexInput>; // vector<vector<u8>>
    emojiIndicesSequence: HexInput; // vector<u8>
    marketAddress: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, emojiBytes, emojiIndicesSequence, marketAddress, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {
      emojiBytes: new MoveVector(emojiBytes.map((argA) => MoveVector.U8(argA))),
      emojiIndicesSequence: MoveVector.U8(emojiIndicesSequence),
      marketAddress: AccountAddress.from(marketAddress),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    emojiBytes: Array<HexInput>; // vector<vector<u8>>
    emojiIndicesSequence: HexInput; // vector<u8>
    marketAddress: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP],
    feePayer?: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<EntryFunctionTransactionBuilder> {
    const { aptosConfig, options, feePayer } = args;
    const payloadBuilder = new this(args);
    const rawTransactionInput = await buildTransaction({
      aptosConfig,
      sender: payloadBuilder.primarySender,
      payload: payloadBuilder.createPayload(),
      options,
      feePayerAddress: feePayer,
    });
    const aptos = new Aptos(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    user: Account; // &signer
    emojiBytes: Array<HexInput>; // vector<vector<u8>>
    emojiIndicesSequence: HexInput; // vector<u8>
    marketAddress: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { user: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Chat.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      user: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type ProvideLiquidityPayloadMoveArguments = {
  provider: AccountAddress;
  quoteAmount: U64;
};

/**
 *```
 *  public entry fun provide_liquidity<Emojicoin, EmojicoinLP>(
 *     market_address: &signer,
 *     provider: address,
 *     quote_amount: u64,
 *  )
 *```
 * */

export class ProvideLiquidity extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "provide_liquidity";

  public readonly args: ProvideLiquidityPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    marketAddress: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    quoteAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { marketAddress, provider, quoteAmount, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(marketAddress);

    this.args = {
      provider: AccountAddress.from(provider),
      quoteAmount: new U64(quoteAmount),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    marketAddress: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    quoteAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP],
    feePayer?: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<EntryFunctionTransactionBuilder> {
    const { aptosConfig, options, feePayer } = args;
    const payloadBuilder = new this(args);
    const rawTransactionInput = await buildTransaction({
      aptosConfig,
      sender: payloadBuilder.primarySender,
      payload: payloadBuilder.createPayload(),
      options,
      feePayerAddress: feePayer,
    });
    const aptos = new Aptos(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    marketAddress: Account; // &signer
    provider: AccountAddressInput; // address
    quoteAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { marketAddress: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await ProvideLiquidity.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      marketAddress: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type RegisterMarketPayloadMoveArguments = {
  emojis: MoveVector<MoveVector<U8>>;
  integrator: AccountAddress;
};

/**
 *```
 *  public entry fun register_market(
 *     registrant: &signer,
 *     emojis: vector<vector<u8>>,
 *     integrator: address,
 *  )
 *```
 * */

export class RegisterMarket extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "register_market";

  public readonly args: RegisterMarketPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    registrant: AccountAddressInput; // &signer
    emojis: Array<HexInput>; // vector<vector<u8>>
    integrator: AccountAddressInput; // address
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { registrant, emojis, integrator, feePayer } = args;
    this.primarySender = AccountAddress.from(registrant);

    this.args = {
      emojis: new MoveVector(emojis.map((argA) => MoveVector.U8(argA))),
      integrator: AccountAddress.from(integrator),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    registrant: AccountAddressInput; // &signer
    emojis: Array<HexInput>; // vector<vector<u8>>
    integrator: AccountAddressInput; // address
    feePayer?: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<EntryFunctionTransactionBuilder> {
    const { aptosConfig, options, feePayer } = args;
    const payloadBuilder = new this(args);
    const rawTransactionInput = await buildTransaction({
      aptosConfig,
      sender: payloadBuilder.primarySender,
      payload: payloadBuilder.createPayload(),
      options,
      feePayerAddress: feePayer,
    });
    const aptos = new Aptos(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    registrant: Account; // &signer
    emojis: Array<HexInput>; // vector<vector<u8>>
    integrator: AccountAddressInput; // address
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { registrant: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await RegisterMarket.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      registrant: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type RemoveLiquidityPayloadMoveArguments = {
  provider: AccountAddress;
  lpCoinAmount: U64;
};

/**
 *```
 *  public entry fun remove_liquidity<Emojicoin, EmojicoinLP>(
 *     market_address: &signer,
 *     provider: address,
 *     lp_coin_amount: u64,
 *  )
 *```
 * */

export class RemoveLiquidity extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "remove_liquidity";

  public readonly args: RemoveLiquidityPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    marketAddress: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    lpCoinAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { marketAddress, provider, lpCoinAmount, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(marketAddress);

    this.args = {
      provider: AccountAddress.from(provider),
      lpCoinAmount: new U64(lpCoinAmount),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    marketAddress: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    lpCoinAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP],
    feePayer?: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<EntryFunctionTransactionBuilder> {
    const { aptosConfig, options, feePayer } = args;
    const payloadBuilder = new this(args);
    const rawTransactionInput = await buildTransaction({
      aptosConfig,
      sender: payloadBuilder.primarySender,
      payload: payloadBuilder.createPayload(),
      options,
      feePayerAddress: feePayer,
    });
    const aptos = new Aptos(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    marketAddress: Account; // &signer
    provider: AccountAddressInput; // address
    lpCoinAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { marketAddress: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await RemoveLiquidity.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      marketAddress: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type SwapPayloadMoveArguments = {
  swapper: AccountAddress;
  inputAmount: U64;
  isSell: Bool;
  integrator: AccountAddress;
  integratorFeeRateBps: U8;
};

/**
 *```
 *  public entry fun swap<Emojicoin, EmojicoinLP>(
 *     market_address: &signer,
 *     swapper: address,
 *     input_amount: u64,
 *     is_sell: bool,
 *     integrator: address,
 *     integrator_fee_rate_bps: u8,
 *  )
 *```
 * */

export class Swap extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "swap";

  public readonly args: SwapPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    marketAddress: AccountAddressInput; // &signer
    swapper: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    isSell: boolean; // bool
    integrator: AccountAddressInput; // address
    integratorFeeRateBps: Uint8; // u8
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const {
      marketAddress,
      swapper,
      inputAmount,
      isSell,
      integrator,
      integratorFeeRateBps,
      typeTags,
      feePayer,
    } = args;
    this.primarySender = AccountAddress.from(marketAddress);

    this.args = {
      swapper: AccountAddress.from(swapper),
      inputAmount: new U64(inputAmount),
      isSell: new Bool(isSell),
      integrator: AccountAddress.from(integrator),
      integratorFeeRateBps: new U8(integratorFeeRateBps),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    marketAddress: AccountAddressInput; // &signer
    swapper: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    isSell: boolean; // bool
    integrator: AccountAddressInput; // address
    integratorFeeRateBps: Uint8; // u8
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP],
    feePayer?: AccountAddressInput;
    options?: InputGenerateTransactionOptions;
  }): Promise<EntryFunctionTransactionBuilder> {
    const { aptosConfig, options, feePayer } = args;
    const payloadBuilder = new this(args);
    const rawTransactionInput = await buildTransaction({
      aptosConfig,
      sender: payloadBuilder.primarySender,
      payload: payloadBuilder.createPayload(),
      options,
      feePayerAddress: feePayer,
    });
    const aptos = new Aptos(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    marketAddress: Account; // &signer
    swapper: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    isSell: boolean; // bool
    integrator: AccountAddressInput; // address
    integratorFeeRateBps: Uint8; // u8
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { marketAddress: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Swap.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      marketAddress: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type IsASupplementalChatEmojiPayloadMoveArguments = {
  hexBytes: MoveVector<U8>;
};

/**
 *```
 *  #[view]
 *  public fun is_a_supplemental_chat_emoji(
 *     hex_bytes: vector<u8>,
 *  ): bool
 *```
 * */

export class IsASupplementalChatEmoji extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "is_a_supplemental_chat_emoji";

  public readonly args: IsASupplementalChatEmojiPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    hexBytes: HexInput; // vector<u8>
  }) {
    super();
    const { hexBytes } = args;

    this.args = {
      hexBytes: MoveVector.U8(hexBytes),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    hexBytes: HexInput; // vector<u8>
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [res] = await new IsASupplementalChatEmoji(args).view(args);
    return res;
  }
}

export type IsASupportedChatEmojiPayloadMoveArguments = {
  hexBytes: MoveVector<U8>;
};

/**
 *```
 *  #[view]
 *  public fun is_a_supported_chat_emoji(
 *     hex_bytes: vector<u8>,
 *  ): bool
 *```
 * */

export class IsASupportedChatEmoji extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "is_a_supported_chat_emoji";

  public readonly args: IsASupportedChatEmojiPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    hexBytes: HexInput; // vector<u8>
  }) {
    super();
    const { hexBytes } = args;

    this.args = {
      hexBytes: MoveVector.U8(hexBytes),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    hexBytes: HexInput; // vector<u8>
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [res] = await new IsASupportedChatEmoji(args).view(args);
    return res;
  }
}

export type IsASupportedSymbolEmojiPayloadMoveArguments = {
  hexBytes: MoveVector<U8>;
};

/**
 *```
 *  #[view]
 *  public fun is_a_supported_symbol_emoji(
 *     hex_bytes: vector<u8>,
 *  ): bool
 *```
 * */

export class IsASupportedSymbolEmoji extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "is_a_supported_symbol_emoji";

  public readonly args: IsASupportedSymbolEmojiPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    hexBytes: HexInput; // vector<u8>
  }) {
    super();
    const { hexBytes } = args;

    this.args = {
      hexBytes: MoveVector.U8(hexBytes),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    hexBytes: HexInput; // vector<u8>
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [res] = await new IsASupportedSymbolEmoji(args).view(args);
    return res;
  }
}

export type MarketMetadataByEmojiBytesPayloadMoveArguments = {
  emojiBytes: MoveVector<U8>;
};

/**
 *```
 *  #[view]
 *  public fun market_metadata_by_emoji_bytes(
 *     emoji_bytes: vector<u8>,
 *  ): Option<emojicoin_dot_fun::emojicoin_dot_fun::MarketMetadata>
 *```
 * */

export class MarketMetadataByEmojiBytes extends ViewFunctionPayloadBuilder<[Option<MoveValue>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "market_metadata_by_emoji_bytes";

  public readonly args: MarketMetadataByEmojiBytesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    emojiBytes: HexInput; // vector<u8>
  }) {
    super();
    const { emojiBytes } = args;

    this.args = {
      emojiBytes: MoveVector.U8(emojiBytes),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    emojiBytes: HexInput; // vector<u8>
    options?: LedgerVersionArg;
  }): Promise<Option<MoveValue>> {
    const [res] = await new MarketMetadataByEmojiBytes(args).view(args);
    return res;
  }
}

export type MarketMetadataByMarketAddressPayloadMoveArguments = {
  marketAddress: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun market_metadata_by_market_address(
 *     market_address: address,
 *  ): Option<emojicoin_dot_fun::emojicoin_dot_fun::MarketMetadata>
 *```
 * */

export class MarketMetadataByMarketAddress extends ViewFunctionPayloadBuilder<[Option<MoveValue>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "market_metadata_by_market_address";

  public readonly args: MarketMetadataByMarketAddressPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    marketAddress: AccountAddressInput; // address
  }) {
    super();
    const { marketAddress } = args;

    this.args = {
      marketAddress: AccountAddress.from(marketAddress),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    marketAddress: AccountAddressInput; // address
    options?: LedgerVersionArg;
  }): Promise<Option<MoveValue>> {
    const [res] = await new MarketMetadataByMarketAddress(args).view(args);
    return res;
  }
}

export type MarketMetadataByMarketIdPayloadMoveArguments = {
  marketId: U64;
};

/**
 *```
 *  #[view]
 *  public fun market_metadata_by_market_id(
 *     market_id: u64,
 *  ): Option<emojicoin_dot_fun::emojicoin_dot_fun::MarketMetadata>
 *```
 * */

export class MarketMetadataByMarketId extends ViewFunctionPayloadBuilder<[Option<MoveValue>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "market_metadata_by_market_id";

  public readonly args: MarketMetadataByMarketIdPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    marketId: Uint64; // u64
  }) {
    super();
    const { marketId } = args;

    this.args = {
      marketId: new U64(marketId),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    marketId: Uint64; // u64
    options?: LedgerVersionArg;
  }): Promise<Option<MoveValue>> {
    const [res] = await new MarketMetadataByMarketId(args).view(args);
    return res;
  }
}

export type MarketViewPayloadMoveArguments = {
  marketAddress: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun market_view<Emojicoin, EmojicoinLP>(
 *     market_address: address,
 *  ): emojicoin_dot_fun::emojicoin_dot_fun::MarketView
 *```
 * */

export class MarketView extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "market_view";

  public readonly args: MarketViewPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  constructor(args: {
    marketAddress: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
  }) {
    super();
    const { marketAddress, typeTags } = args;

    this.args = {
      marketAddress: AccountAddress.from(marketAddress),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    marketAddress: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new MarketView(args).view(args);
    return res;
  }
}

/**
 *```
 *  #[view]
 *  public fun registry_address(): address
 *```
 * */

export class RegistryAddress extends ViewFunctionPayloadBuilder<[AccountAddressString]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "registry_address";

  public readonly args: {};

  public readonly typeTags: [] = [];

  constructor() {
    super();

    this.args = {};
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    options?: LedgerVersionArg;
  }): Promise<AccountAddressString> {
    const [res] = await new RegistryAddress().view(args);
    return res;
  }
}

/**
 *```
 *  #[view]
 *  public fun registry_view(): emojicoin_dot_fun::emojicoin_dot_fun::RegistryView
 *```
 * */

export class RegistryView extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "registry_view";

  public readonly args: {};

  public readonly typeTags: [] = [];

  constructor() {
    super();

    this.args = {};
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new RegistryView().view(args);
    return res;
  }
}

export type SimulateProvideLiquidityPayloadMoveArguments = {
  marketAddress: AccountAddress;
  provider: AccountAddress;
  quoteAmount: U64;
};

/**
 *```
 *  #[view]
 *  public fun simulate_provide_liquidity(
 *     market_address: address,
 *     provider: address,
 *     quote_amount: u64,
 *  ): emojicoin_dot_fun::emojicoin_dot_fun::Liquidity
 *```
 * */

export class SimulateProvideLiquidity extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "simulate_provide_liquidity";

  public readonly args: SimulateProvideLiquidityPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    marketAddress: AccountAddressInput; // address
    provider: AccountAddressInput; // address
    quoteAmount: Uint64; // u64
  }) {
    super();
    const { marketAddress, provider, quoteAmount } = args;

    this.args = {
      marketAddress: AccountAddress.from(marketAddress),
      provider: AccountAddress.from(provider),
      quoteAmount: new U64(quoteAmount),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    marketAddress: AccountAddressInput; // address
    provider: AccountAddressInput; // address
    quoteAmount: Uint64; // u64
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new SimulateProvideLiquidity(args).view(args);
    return res;
  }
}

export type SimulateRemoveLiquidityPayloadMoveArguments = {
  marketAddress: AccountAddress;
  provider: AccountAddress;
  lpCoinAmount: U64;
};

/**
 *```
 *  #[view]
 *  public fun simulate_remove_liquidity<Emojicoin>(
 *     market_address: address,
 *     provider: address,
 *     lp_coin_amount: u64,
 *  ): emojicoin_dot_fun::emojicoin_dot_fun::Liquidity
 *```
 * */

export class SimulateRemoveLiquidity extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "simulate_remove_liquidity";

  public readonly args: SimulateRemoveLiquidityPayloadMoveArguments;

  public readonly typeTags: [TypeTag]; // [Emojicoin]

  constructor(args: {
    marketAddress: AccountAddressInput; // address
    provider: AccountAddressInput; // address
    lpCoinAmount: Uint64; // u64
    typeTags: [TypeTagInput]; // [Emojicoin]
  }) {
    super();
    const { marketAddress, provider, lpCoinAmount, typeTags } = args;

    this.args = {
      marketAddress: AccountAddress.from(marketAddress),
      provider: AccountAddress.from(provider),
      lpCoinAmount: new U64(lpCoinAmount),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    marketAddress: AccountAddressInput; // address
    provider: AccountAddressInput; // address
    lpCoinAmount: Uint64; // u64
    typeTags: [TypeTagInput]; // [Emojicoin]
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new SimulateRemoveLiquidity(args).view(args);
    return res;
  }
}

export type SimulateSwapPayloadMoveArguments = {
  marketAddress: AccountAddress;
  swapper: AccountAddress;
  inputAmount: U64;
  isSell: Bool;
  integrator: AccountAddress;
  integratorFeeRateBps: U8;
};

/**
 *```
 *  #[view]
 *  public fun simulate_swap(
 *     market_address: address,
 *     swapper: address,
 *     input_amount: u64,
 *     is_sell: bool,
 *     integrator: address,
 *     integrator_fee_rate_bps: u8,
 *  ): emojicoin_dot_fun::emojicoin_dot_fun::Swap
 *```
 * */

export class SimulateSwap extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "simulate_swap";

  public readonly args: SimulateSwapPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    marketAddress: AccountAddressInput; // address
    swapper: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    isSell: boolean; // bool
    integrator: AccountAddressInput; // address
    integratorFeeRateBps: Uint8; // u8
  }) {
    super();
    const { marketAddress, swapper, inputAmount, isSell, integrator, integratorFeeRateBps } = args;

    this.args = {
      marketAddress: AccountAddress.from(marketAddress),
      swapper: AccountAddress.from(swapper),
      inputAmount: new U64(inputAmount),
      isSell: new Bool(isSell),
      integrator: AccountAddress.from(integrator),
      integratorFeeRateBps: new U8(integratorFeeRateBps),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    marketAddress: AccountAddressInput; // address
    swapper: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    isSell: boolean; // bool
    integrator: AccountAddressInput; // address
    integratorFeeRateBps: Uint8; // u8
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new SimulateSwap(args).view(args);
    return res;
  }
}

export type VerifiedSymbolEmojiBytesPayloadMoveArguments = {
  emojis: MoveVector<MoveVector<U8>>;
};

/**
 *```
 *  #[view]
 *  public fun verified_symbol_emoji_bytes(
 *     emojis: vector<vector<u8>>,
 *  ): vector<u8>
 *```
 * */

export class VerifiedSymbolEmojiBytes extends ViewFunctionPayloadBuilder<[string]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "verified_symbol_emoji_bytes";

  public readonly args: VerifiedSymbolEmojiBytesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    emojis: Array<HexInput>; // vector<vector<u8>>
  }) {
    super();
    const { emojis } = args;

    this.args = {
      emojis: new MoveVector(emojis.map((argA) => MoveVector.U8(argA))),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    emojis: Array<HexInput>; // vector<vector<u8>>
    options?: LedgerVersionArg;
  }): Promise<string> {
    const [res] = await new VerifiedSymbolEmojiBytes(args).view(args);
    return res;
  }
}
