// cspell:word funder
/* eslint-disable max-classes-per-file */
import {
  AccountAddress,
  type TypeTag,
  U64,
  Bool,
  type Account,
  Aptos,
  type AptosConfig,
  type AccountAddressInput,
  parseTypeTag,
  buildTransaction,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  type UserTransactionResponse,
  type MoveValue,
  type LedgerVersionArg,
} from "@aptos-labs/ts-sdk";
import { type TypeTagInput, type Uint64, type Uint64String } from "../types";
import {
  ViewFunctionPayloadBuilder,
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
} from "../payload-builders";
import { ARENA_MODULE_ADDRESS } from "../../const";

export type FundVaultPayloadMoveArguments = {
  amount: U64;
};

/**
 *```
 *  public entry fun fund_vault(
 *     funder: &signer,
 *     amount: u64,
 *  )
 *```
 * */

export class FundVault extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "fund_vault";

  public readonly args: FundVaultPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    funder: AccountAddressInput; // &signer
    amount: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { funder, amount, feePayer } = args;
    this.primarySender = AccountAddress.from(funder);

    this.args = {
      amount: new U64(amount),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    funder: AccountAddressInput; // &signer
    amount: Uint64; // u64
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
    funder: Account; // &signer
    amount: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { funder: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await FundVault.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      funder: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type SetNextMeleeAvailableRewardsPayloadMoveArguments = {
  amount: U64;
};

/**
 *```
 *  public entry fun set_next_melee_available_rewards(
 *     emojicoin_arena: &signer,
 *     amount: u64,
 *  )
 *```
 * */

export class SetNextMeleeAvailableRewards extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "set_next_melee_available_rewards";

  public readonly args: SetNextMeleeAvailableRewardsPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    emojicoinArena: AccountAddressInput; // &signer
    amount: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { emojicoinArena, amount, feePayer } = args;
    this.primarySender = AccountAddress.from(emojicoinArena);

    this.args = {
      amount: new U64(amount),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    emojicoinArena: AccountAddressInput; // &signer
    amount: Uint64; // u64
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
    emojicoinArena: Account; // &signer
    amount: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { emojicoinArena: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await SetNextMeleeAvailableRewards.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      emojicoinArena: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type SetNextMeleeDurationPayloadMoveArguments = {
  duration: U64;
};

/**
 *```
 *  public entry fun set_next_melee_duration(
 *     emojicoin_arena: &signer,
 *     duration: u64,
 *  )
 *```
 * */

export class SetNextMeleeDuration extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "set_next_melee_duration";

  public readonly args: SetNextMeleeDurationPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    emojicoinArena: AccountAddressInput; // &signer
    duration: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { emojicoinArena, duration, feePayer } = args;
    this.primarySender = AccountAddress.from(emojicoinArena);

    this.args = {
      duration: new U64(duration),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    emojicoinArena: AccountAddressInput; // &signer
    duration: Uint64; // u64
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
    emojicoinArena: Account; // &signer
    duration: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { emojicoinArena: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await SetNextMeleeDuration.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      emojicoinArena: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type SetNextMeleeMaxMatchAmountPayloadMoveArguments = {
  maxMatchAmount: U64;
};

/**
 *```
 *  public entry fun set_next_melee_max_match_amount(
 *     emojicoin_arena: &signer,
 *     max_match_amount: u64,
 *  )
 *```
 * */

export class SetNextMeleeMaxMatchAmount extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "set_next_melee_max_match_amount";

  public readonly args: SetNextMeleeMaxMatchAmountPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    emojicoinArena: AccountAddressInput; // &signer
    maxMatchAmount: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { emojicoinArena, maxMatchAmount, feePayer } = args;
    this.primarySender = AccountAddress.from(emojicoinArena);

    this.args = {
      maxMatchAmount: new U64(maxMatchAmount),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    emojicoinArena: AccountAddressInput; // &signer
    maxMatchAmount: Uint64; // u64
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
    emojicoinArena: Account; // &signer
    maxMatchAmount: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { emojicoinArena: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await SetNextMeleeMaxMatchAmount.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      emojicoinArena: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type SetNextMeleeMaxMatchPercentagePayloadMoveArguments = {
  maxMatchPercentage: U64;
};

/**
 *```
 *  public entry fun set_next_melee_max_match_percentage(
 *     emojicoin_arena: &signer,
 *     max_match_percentage: u64,
 *  )
 *```
 * */

export class SetNextMeleeMaxMatchPercentage extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "set_next_melee_max_match_percentage";

  public readonly args: SetNextMeleeMaxMatchPercentagePayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    emojicoinArena: AccountAddressInput; // &signer
    maxMatchPercentage: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { emojicoinArena, maxMatchPercentage, feePayer } = args;
    this.primarySender = AccountAddress.from(emojicoinArena);

    this.args = {
      maxMatchPercentage: new U64(maxMatchPercentage),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    emojicoinArena: AccountAddressInput; // &signer
    maxMatchPercentage: Uint64; // u64
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
    emojicoinArena: Account; // &signer
    maxMatchPercentage: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { emojicoinArena: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await SetNextMeleeMaxMatchPercentage.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      emojicoinArena: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type WithdrawFromVaultPayloadMoveArguments = {
  amount: U64;
};

/**
 *```
 *  public entry fun withdraw_from_vault(
 *     emojicoin_arena: &signer,
 *     amount: u64,
 *  )
 *```
 * */

export class WithdrawFromVault extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "withdraw_from_vault";

  public readonly args: WithdrawFromVaultPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    emojicoinArena: AccountAddressInput; // &signer
    amount: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { emojicoinArena, amount, feePayer } = args;
    this.primarySender = AccountAddress.from(emojicoinArena);

    this.args = {
      amount: new U64(amount),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    emojicoinArena: AccountAddressInput; // &signer
    amount: Uint64; // u64
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
    emojicoinArena: Account; // &signer
    amount: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { emojicoinArena: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await WithdrawFromVault.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      emojicoinArena: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

/**
 *```
 *   entry fun swap<Coin0, LP0, Coin1, LP1>()
 *     swapper: &signer,
 *```
 * */

export class Swap extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "swap";

  public readonly args: Record<string, never>;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Coin0, LP0, Coin1, LP1]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    swapper: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { swapper, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(swapper);

    this.args = {};
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    swapper: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1],
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
    swapper: Account; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { swapper: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Swap.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      swapper: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type EnterPayloadMoveArguments = {
  inputAmount: U64;
  lockIn: Bool;
};

/**
 *```
 *   entry fun enter<Coin0, LP0, Coin1, LP1, EscrowCoin>(
 *     entrant: &signer,
 *     input_amount: u64,
 *     lock_in: bool,
 *  )
 *```
 * */

export class Enter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "enter";

  public readonly args: EnterPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag, TypeTag]; // [Coin0, LP0, Coin1, LP1, EscrowCoin]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    entrant: AccountAddressInput; // &signer
    inputAmount: Uint64; // u64
    lockIn: boolean; // bool
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1, EscrowCoin]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { entrant, inputAmount, lockIn, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(entrant);

    this.args = {
      inputAmount: new U64(inputAmount),
      lockIn: new Bool(lockIn),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    entrant: AccountAddressInput; // &signer
    inputAmount: Uint64; // u64
    lockIn: boolean; // bool
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1, EscrowCoin],
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
    entrant: Account; // &signer
    inputAmount: Uint64; // u64
    lockIn: boolean; // bool
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1, EscrowCoin]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { entrant: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Enter.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      entrant: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

/**
 *```
 *   entry fun exit<Coin0, LP0, Coin1, LP1>()
 *     participant: &signer,
 *```
 * */

export class Exit extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "exit";

  public readonly args: Record<string, never>;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Coin0, LP0, Coin1, LP1]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    participant: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { participant, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(participant);

    this.args = {};
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    participant: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1],
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
    participant: Account; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { participant: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Exit.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      participant: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

/**
 *```
 *  #[view]
 *  public fun registry(): emojicoin_arena::emojicoin_arena::RegistryView
 *```
 * */

export class Registry extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "registry";

  public readonly args: Record<string, never>;

  public readonly typeTags: [] = [];

  constructor() {
    super();

    this.args = {};
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new Registry().view(args);
    return res;
  }
}

export type EscrowPayloadMoveArguments = {
  participant: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun escrow<Coin0, LP0, Coin1, LP1>(
 *     participant: address,
 *  ): emojicoin_arena::emojicoin_arena::EscrowView
 *```
 * */

export class Escrow extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "escrow";

  public readonly args: EscrowPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Coin0, LP0, Coin1, LP1]

  constructor(args: {
    participant: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
  }) {
    super();
    const { participant, typeTags } = args;

    this.args = {
      participant: AccountAddress.from(participant),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    participant: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new Escrow(args).view(args);
    return res;
  }
}

export type EscrowExistsPayloadMoveArguments = {
  participant: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun escrow_exists<Coin0, LP0, Coin1, LP1>(
 *     participant: address,
 *  ): bool
 *```
 * */

export class EscrowExists extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "escrow_exists";

  public readonly args: EscrowExistsPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Coin0, LP0, Coin1, LP1]

  constructor(args: {
    participant: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
  }) {
    super();
    const { participant, typeTags } = args;

    this.args = {
      participant: AccountAddress.from(participant),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    participant: AccountAddressInput; // address
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [res] = await new EscrowExists(args).view(args);
    return res;
  }
}

export type ExchangeRatePayloadMoveArguments = {
  marketAddress: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun exchange_rate<Emojicoin, EmojicoinLP>(
 *     market_address: address,
 *  ): emojicoin_arena::emojicoin_arena::ExchangeRate
 *```
 * */

export class ExchangeRate extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "exchange_rate";

  public readonly args: ExchangeRatePayloadMoveArguments;

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
    const [res] = await new ExchangeRate(args).view(args);
    return res;
  }
}

export type MatchAmountPayloadMoveArguments = {
  participant: AccountAddress;
  inputAmount: U64;
  meleeID: U64;
};

/**
 *```
 *  #[view]
 *  public fun match_amount<Coin0, LP0, Coin1, LP1>(
 *     participant: address,
 *     input_amount: u64,
 *     melee_id: u64,
 *  ): u64
 *```
 * */

export class MatchAmount extends ViewFunctionPayloadBuilder<[Uint64String]> {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "match_amount";

  public readonly args: MatchAmountPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Coin0, LP0, Coin1, LP1]

  constructor(args: {
    participant: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    meleeID: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
  }) {
    super();
    const { participant, inputAmount, meleeID, typeTags } = args;

    this.args = {
      participant: AccountAddress.from(participant),
      inputAmount: new U64(inputAmount),
      meleeID: new U64(meleeID),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    participant: AccountAddressInput; // address
    inputAmount: Uint64; // u64
    meleeID: Uint64; // u64
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Coin0, LP0, Coin1, LP1]
    options?: LedgerVersionArg;
  }): Promise<Uint64String> {
    const [res] = await new MatchAmount(args).view(args);
    return res;
  }
}

export type MeleePayloadMoveArguments = {
  meleeID: U64;
};

/**
 *```
 *  #[view]
 *  public fun melee(
 *     melee_id: u64,
 *  ): emojicoin_arena::emojicoin_arena::Melee
 *```
 * */

export class Melee extends ViewFunctionPayloadBuilder<[MoveValue]> {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "melee";

  public readonly args: MeleePayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    meleeID: Uint64; // u64
  }) {
    super();
    const { meleeID } = args;

    this.args = {
      meleeID: new U64(meleeID),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    meleeID: Uint64; // u64
    options?: LedgerVersionArg;
  }): Promise<MoveValue> {
    const [res] = await new Melee(args).view(args);
    return res;
  }
}
