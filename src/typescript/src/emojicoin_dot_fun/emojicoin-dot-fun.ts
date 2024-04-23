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
  Hex,
  type HexInput,
  parseTypeTag,
  buildTransaction,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  type UserTransactionResponse,
  type MoveValue,
} from "@aptos-labs/ts-sdk";
import { type TypeTagInput, type Uint8, type Uint64 } from "./types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
} from "./payload-builders";

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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "provide_liquidity";

  public readonly args: ProvideLiquidityPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    moduleAddress: AccountAddressInput; // The module address. You can turn this option off in your config.yaml.
    marketAddress: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    quoteAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const { moduleAddress, marketAddress, provider, quoteAmount, typeTags, feePayer } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
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
    moduleAddress: AccountAddressInput;
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
    moduleAddress: AccountAddressInput;
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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "register_market";

  public readonly args: RegisterMarketPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    moduleAddress: AccountAddressInput; // The module address. You can turn this option off in your config.yaml.
    registrant: AccountAddressInput; // &signer
    emojis: Array<HexInput>; // vector<vector<u8>>
    integrator: AccountAddressInput; // address
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const { moduleAddress, registrant, emojis, integrator, feePayer } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
    this.primarySender = AccountAddress.from(registrant);

    this.args = {
      emojis: new MoveVector(emojis.map((argA) => MoveVector.U8(argA))),
      integrator: AccountAddress.from(integrator),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    moduleAddress: AccountAddressInput;
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
    moduleAddress: AccountAddressInput;
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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "remove_liquidity";

  public readonly args: RemoveLiquidityPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    moduleAddress: AccountAddressInput; // The module address. You can turn this option off in your config.yaml.
    marketAddress: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    lpCoinAmount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const { moduleAddress, marketAddress, provider, lpCoinAmount, typeTags, feePayer } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
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
    moduleAddress: AccountAddressInput;
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
    moduleAddress: AccountAddressInput;
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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "swap";

  public readonly args: SwapPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag]; // [Emojicoin, EmojicoinLP]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    moduleAddress: AccountAddressInput; // The module address. You can turn this option off in your config.yaml.
    marketAddress: AccountAddressInput; // &signer
    swapper: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    isSell: boolean; // bool
    integrator: AccountAddressInput; // address
    integratorFeeRateBps: Uint8; // u8
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const {
      moduleAddress,
      marketAddress,
      swapper,
      inputAmount,
      isSell,
      integrator,
      integratorFeeRateBps,
      typeTags,
      feePayer,
    } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
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
    moduleAddress: AccountAddressInput;
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
    moduleAddress: AccountAddressInput;
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

export type IsASupportedEmojiPayloadMoveArguments = {
  hexBytes: HexInput;
};

/**
 *```
 *  #[view]
 *  public fun is_a_supported_emoji(
 *     hex_bytes: vector<u8>,
 *  ): bool
 *```
 * */

export class IsASupportedEmoji extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "is_a_supported_emoji";

  public readonly args: IsASupportedEmojiPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    moduleAddress: string; // The module address. You can turn this option off in your config.yaml.

    hexBytes: HexInput; // vector<u8>
  }) {
    super();
    const { moduleAddress, hexBytes } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      hexBytes: Hex.fromHexInput(hexBytes).toUint8Array(),
    };
  }
}

export type IsSupportedEmojiSequencePayloadMoveArguments = {
  emojis: Array<HexInput>;
};

/**
 *```
 *  #[view]
 *  public fun is_supported_emoji_sequence(
 *     emojis: vector<vector<u8>>,
 *  ): bool
 *```
 * */

export class IsSupportedEmojiSequence extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "is_supported_emoji_sequence";

  public readonly args: IsSupportedEmojiSequencePayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    moduleAddress: string; // The module address. You can turn this option off in your config.yaml.

    emojis: Array<HexInput>; // vector<vector<u8>>
  }) {
    super();
    const { moduleAddress, emojis } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      emojis: emojis.map((argA) => Hex.fromHexInput(argA).toUint8Array()),
    };
  }
}

export type SimulateProvideLiquidityPayloadMoveArguments = {
  marketAddress: string;
  provider: string;
  quoteAmount: string;
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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "simulate_provide_liquidity";

  public readonly args: SimulateProvideLiquidityPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    moduleAddress: string; // The module address. You can turn this option off in your config.yaml.

    marketAddress: string; // address
    provider: string; // address
    quoteAmount: string; // u64
  }) {
    super();
    const { moduleAddress, marketAddress, provider, quoteAmount } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      marketAddress: AccountAddress.from(marketAddress).toString(),
      provider: AccountAddress.from(provider).toString(),
      quoteAmount: BigInt(quoteAmount).toString(),
    };
  }
}

export type SimulateRemoveLiquidityPayloadMoveArguments = {
  marketAddress: string;
  provider: string;
  lpCoinAmount: string;
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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "simulate_remove_liquidity";

  public readonly args: SimulateRemoveLiquidityPayloadMoveArguments;

  public readonly typeTags: [TypeTag]; // [Emojicoin]

  constructor(args: {
    moduleAddress: string; // The module address. You can turn this option off in your config.yaml.

    marketAddress: string; // address
    provider: string; // address
    lpCoinAmount: string; // u64
    typeTags: [TypeTagInput]; // [Emojicoin]
  }) {
    super();
    const { moduleAddress, marketAddress, provider, lpCoinAmount, typeTags } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      marketAddress: AccountAddress.from(marketAddress).toString(),
      provider: AccountAddress.from(provider).toString(),
      lpCoinAmount: BigInt(lpCoinAmount).toString(),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
  }
}

export type SimulateSwapPayloadMoveArguments = {
  marketAddress: string;
  swapper: string;
  inputAmount: string;
  isSell: boolean;
  integrator: string;
  integratorFeeRateBps: Uint8;
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
  public readonly moduleAddress: AccountAddress;

  public readonly moduleName = "emojicoin_dot_fun";

  public readonly functionName = "simulate_swap";

  public readonly args: SimulateSwapPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    moduleAddress: string; // The module address. You can turn this option off in your config.yaml.

    marketAddress: string; // address
    swapper: string; // address
    inputAmount: string; // u64
    isSell: boolean; // bool
    integrator: string; // address
    integratorFeeRateBps: Uint8; // u8
  }) {
    super();
    const {
      moduleAddress,
      marketAddress,
      swapper,
      inputAmount,
      isSell,
      integrator,
      integratorFeeRateBps,
    } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      marketAddress: AccountAddress.from(marketAddress).toString(),
      swapper: AccountAddress.from(swapper).toString(),
      inputAmount: BigInt(inputAmount).toString(),
      isSell,
      integrator: AccountAddress.from(integrator).toString(),
      integratorFeeRateBps,
    };
  }
}
