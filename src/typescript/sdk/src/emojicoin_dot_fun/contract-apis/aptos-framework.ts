/* eslint-disable import/no-unused-modules */
import {
  MoveVector,
  AccountAddress,
  type Aptos,
  U64,
  type AccountAddressInput,
  type Uint64,
  type AptosConfig,
  type InputGenerateTransactionOptions,
  buildTransaction,
  type Account,
  type WaitForTransactionOptions,
  type UserTransactionResponse,
  type TypeTag,
  parseTypeTag,
  type LedgerVersionArg,
} from "@aptos-labs/ts-sdk";
import {
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
  ViewFunctionPayloadBuilder,
} from "../payload-builders";
import { type Uint64String, type TypeTagInput } from "..";
import { getAptosClient } from "../../utils/aptos-client";

export type MintPayloadMoveArguments = {
  dstAddr: AccountAddress;
  amount: U64;
};

/**
 *```
 *  public entry fun mint(
 *     account: &signer,
 *     dst_addr: address,
 *     amount: u64,
 *  )
 *```
 * */

export class Mint extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "aptos_coin";

  public readonly functionName = "mint";

  public readonly args: MintPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    account: AccountAddressInput; // &signer
    dstAddr: AccountAddressInput; // address
    amount: Uint64; // u64
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { account, dstAddr, amount, feePayer } = args;
    this.primarySender = AccountAddress.from(account);

    this.args = {
      dstAddr: AccountAddress.from(dstAddr),
      amount: new U64(amount),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    account: AccountAddressInput; // &signer
    dstAddr: AccountAddressInput; // address
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
    const aptos = getAptosClient(aptosConfig);
    return new EntryFunctionTransactionBuilder(payloadBuilder, aptos, rawTransactionInput);
  }

  static async submit(args: {
    aptosConfig: AptosConfig;
    account: Account; // &signer
    dstAddr: AccountAddressInput; // address
    amount: Uint64; // u64
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { account: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await Mint.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      account: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type BatchTransferCoinsPayloadMoveArguments = {
  recipients: MoveVector<AccountAddress>;
  amounts: MoveVector<U64>;
};

/**
 *```
 *  public entry fun batch_transfer_coins<CoinType>(
 *     from: &signer,
 *     recipients: vector<address>,
 *     amounts: vector<u64>,
 *  )
 *```
 * */

export class BatchTransferCoins extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "aptos_account";

  public readonly functionName = "batch_transfer_coins";

  public readonly args: BatchTransferCoinsPayloadMoveArguments;

  public readonly typeTags: [TypeTag]; // [CoinType]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    from: AccountAddressInput; // &signer
    recipients: Array<AccountAddressInput>; // vector<address>
    amounts: Array<Uint64>; // vector<u64>
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { from, recipients, amounts, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(from);

    this.args = {
      recipients: new MoveVector(recipients.map((argA) => AccountAddress.from(argA))),
      amounts: new MoveVector(amounts.map((argA) => new U64(argA))),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    from: AccountAddressInput; // &signer
    recipients: Array<AccountAddressInput>; // vector<address>
    amounts: Array<Uint64>; // vector<u64>
    typeTags: [TypeTagInput]; // [CoinType],
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
    from: Account; // &signer
    recipients: Array<AccountAddressInput>; // vector<address>
    amounts: Array<Uint64>; // vector<u64>
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { from: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await BatchTransferCoins.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      from: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type TransferCoinsPayloadMoveArguments = {
  to: AccountAddress;
  amount: U64;
};

/**
 *```
 *  public entry fun transfer_coins<CoinType>(
 *     from: &signer,
 *     to: address,
 *     amount: u64,
 *  )
 *```
 * */

export class TransferCoins extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "aptos_account";

  public readonly functionName = "transfer_coins";

  public readonly args: TransferCoinsPayloadMoveArguments;

  public readonly typeTags: [TypeTag]; // [CoinType]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    from: AccountAddressInput; // &signer
    to: AccountAddressInput; // address
    amount: Uint64; // u64
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { from, to, amount, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(from);

    this.args = {
      to: AccountAddress.from(to),
      amount: new U64(amount),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    from: AccountAddressInput; // &signer
    to: AccountAddressInput; // address
    amount: Uint64; // u64
    typeTags: [TypeTagInput]; // [CoinType],
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
    from: Account; // &signer
    to: AccountAddressInput; // address
    amount: Uint64; // u64
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { from: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await TransferCoins.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      from: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type ExistsAtPayloadMoveArguments = {
  addr: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun exists_at(
 *     addr: address,
 *  ): bool
 *```
 * */

export class ExistsAt extends ViewFunctionPayloadBuilder<[boolean]> {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "account";

  public readonly functionName = "exists_at";

  public readonly args: ExistsAtPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    addr: AccountAddressInput; // address
  }) {
    super();
    const { addr } = args;

    this.args = {
      addr: AccountAddress.from(addr),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    addr: AccountAddressInput; // address
    options?: LedgerVersionArg;
  }): Promise<boolean> {
    const [res] = await new ExistsAt(args).view(args);
    return res;
  }
}

export type BalancePayloadMoveArguments = {
  owner: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun balance<CoinType>(
 *     owner: address,
 *  ): u64
 *```
 * */

export class Balance extends ViewFunctionPayloadBuilder<[Uint64String]> {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "coin";

  public readonly functionName = "balance";

  public readonly args: BalancePayloadMoveArguments;

  public readonly typeTags: [TypeTag]; // [CoinType]

  constructor(args: {
    owner: AccountAddressInput; // address
    typeTags: [TypeTagInput]; // [CoinType]
  }) {
    super();
    const { owner, typeTags } = args;

    this.args = {
      owner: AccountAddress.from(owner),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    owner: AccountAddressInput; // address
    typeTags: [TypeTagInput]; // [CoinType]
    options?: LedgerVersionArg;
  }): Promise<Uint64String> {
    const [res] = await new Balance(args).view(args);
    return res;
  }
}
