// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
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
  quote_amount: U64;
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
    market_address: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    quote_amount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const { moduleAddress, market_address, provider, quote_amount, typeTags, feePayer } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
    this.primarySender = AccountAddress.from(market_address);

    this.args = {
      provider: AccountAddress.from(provider),
      quote_amount: new U64(quote_amount),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    moduleAddress: AccountAddressInput;
    aptosConfig: AptosConfig;
    market_address: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    quote_amount: Uint64; // u64
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
    market_address: Account; // &signer
    provider: AccountAddressInput; // address
    quote_amount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { market_address: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await ProvideLiquidity.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      market_address: primarySigner.accountAddress,
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
  lp_coin_amount: U64;
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
    market_address: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    lp_coin_amount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const { moduleAddress, market_address, provider, lp_coin_amount, typeTags, feePayer } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
    this.primarySender = AccountAddress.from(market_address);

    this.args = {
      provider: AccountAddress.from(provider),
      lp_coin_amount: new U64(lp_coin_amount),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    moduleAddress: AccountAddressInput;
    aptosConfig: AptosConfig;
    market_address: AccountAddressInput; // &signer
    provider: AccountAddressInput; // address
    lp_coin_amount: Uint64; // u64
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
    market_address: Account; // &signer
    provider: AccountAddressInput; // address
    lp_coin_amount: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { market_address: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await RemoveLiquidity.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      market_address: primarySigner.accountAddress,
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
  input_amount: U64;
  is_sell: Bool;
  integrator: AccountAddress;
  integrator_fee_rate_bps: U8;
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
    market_address: AccountAddressInput; // &signer
    swapper: AccountAddressInput; // address
    input_amount: Uint64; // u64
    is_sell: boolean; // bool
    integrator: AccountAddressInput; // address
    integrator_fee_rate_bps: Uint8; // u8
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: AccountAddressInput; // optional fee payer account to sponsor the transaction
  }) {
    super();
    const {
      moduleAddress,
      market_address,
      swapper,
      input_amount,
      is_sell,
      integrator,
      integrator_fee_rate_bps,
      typeTags,
      feePayer,
    } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);
    this.primarySender = AccountAddress.from(market_address);

    this.args = {
      swapper: AccountAddress.from(swapper),
      input_amount: new U64(input_amount),
      is_sell: new Bool(is_sell),
      integrator: AccountAddress.from(integrator),
      integrator_fee_rate_bps: new U8(integrator_fee_rate_bps),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    moduleAddress: AccountAddressInput;
    aptosConfig: AptosConfig;
    market_address: AccountAddressInput; // &signer
    swapper: AccountAddressInput; // address
    input_amount: Uint64; // u64
    is_sell: boolean; // bool
    integrator: AccountAddressInput; // address
    integrator_fee_rate_bps: Uint8; // u8
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
    market_address: Account; // &signer
    swapper: AccountAddressInput; // address
    input_amount: Uint64; // u64
    is_sell: boolean; // bool
    integrator: AccountAddressInput; // address
    integrator_fee_rate_bps: Uint8; // u8
    typeTags: [TypeTagInput, TypeTagInput]; // [Emojicoin, EmojicoinLP]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { market_address: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Swap.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      market_address: primarySigner.accountAddress,
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
  hex_bytes: HexInput;
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

    hex_bytes: HexInput; // vector<u8>
  }) {
    super();
    const { moduleAddress, hex_bytes } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      hex_bytes: Hex.fromHexInput(hex_bytes).toUint8Array(),
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
  market_address: string;
  provider: string;
  quote_amount: string;
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

    market_address: string; // address
    provider: string; // address
    quote_amount: string; // u64
  }) {
    super();
    const { moduleAddress, market_address, provider, quote_amount } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      market_address: AccountAddress.from(market_address).toString(),
      provider: AccountAddress.from(provider).toString(),
      quote_amount: BigInt(quote_amount).toString(),
    };
  }
}

export type SimulateRemoveLiquidityPayloadMoveArguments = {
  market_address: string;
  provider: string;
  lp_coin_amount: string;
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

    market_address: string; // address
    provider: string; // address
    lp_coin_amount: string; // u64
    typeTags: [TypeTagInput]; // [Emojicoin]
  }) {
    super();
    const { moduleAddress, market_address, provider, lp_coin_amount, typeTags } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      market_address: AccountAddress.from(market_address).toString(),
      provider: AccountAddress.from(provider).toString(),
      lp_coin_amount: BigInt(lp_coin_amount).toString(),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
  }
}

export type SimulateSwapPayloadMoveArguments = {
  market_address: string;
  swapper: string;
  input_amount: string;
  is_sell: boolean;
  integrator: string;
  integrator_fee_rate_bps: Uint8;
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

    market_address: string; // address
    swapper: string; // address
    input_amount: string; // u64
    is_sell: boolean; // bool
    integrator: string; // address
    integrator_fee_rate_bps: Uint8; // u8
  }) {
    super();
    const {
      moduleAddress,
      market_address,
      swapper,
      input_amount,
      is_sell,
      integrator,
      integrator_fee_rate_bps,
    } = args;
    this.moduleAddress = AccountAddress.from(moduleAddress);

    this.args = {
      market_address: AccountAddress.from(market_address).toString(),
      swapper: AccountAddress.from(swapper).toString(),
      input_amount: BigInt(input_amount).toString(),
      is_sell,
      integrator: AccountAddress.from(integrator).toString(),
      integrator_fee_rate_bps,
    };
  }
}
