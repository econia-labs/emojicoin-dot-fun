/* eslint-disable max-classes-per-file */
import {
  AccountAddress,
  type TypeTag,
  U64,
  Bool,
  type Account,
  type AptosConfig,
  type AccountAddressInput,
  parseTypeTag,
  buildTransaction,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type TypeTagInput, type Uint64 } from "../types";
import { EntryFunctionPayloadBuilder, EntryFunctionTransactionBuilder } from "../payload-builders";
import { ARENA_MODULE_ADDRESS } from "../../const";
import { getAptosClient } from "../../utils/aptos-client";

export type EnterPayloadMoveArguments = {
  inputAmount: U64;
  lockIn: Bool;
};

export class Enter extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "enter";

  public readonly args: EnterPayloadMoveArguments;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag, TypeTag]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1, EscrowCoin]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    user: AccountAddressInput; // &signer
    inputAmount: Uint64;
    lockIn: boolean;
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1, EscrowCoin]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, inputAmount, lockIn, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

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
    user: AccountAddressInput; // &signer
    inputAmount: Uint64;
    lockIn: boolean;
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1, EscrowCoin]
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
    const aptos = getAptosClient(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    user: Account; // &signer
    inputAmount: Uint64;
    lockIn: boolean;
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1, EscrowCoin]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { user: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Enter.builder({
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

export class Exit extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "exit";

  public readonly args: Record<never, never>;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    user: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {};
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]
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
    const aptos = getAptosClient(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    user: Account; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { user: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Exit.builder({
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

export class Swap extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = ARENA_MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_arena";

  public readonly functionName = "swap";

  public readonly args: Record<never, never>;

  public readonly typeTags: [TypeTag, TypeTag, TypeTag, TypeTag]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    user: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {};
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag, TypeTag, TypeTag, TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]
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
    const aptos = getAptosClient(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    user: Account; // &signer
    typeTags: [TypeTagInput, TypeTagInput, TypeTagInput, TypeTagInput]; // [Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { user: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Swap.builder({
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
