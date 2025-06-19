/* eslint-disable import/no-unused-modules */
import {
  type Account,
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  type AptosConfig,
  buildTransaction,
  type InputGenerateTransactionOptions,
  type LedgerVersionArg,
  MoveVector,
  parseTypeTag,
  type TypeTag,
  U64,
  type Uint64,
  type UserTransactionResponse,
  type WaitForTransactionOptions,
} from "@aptos-labs/ts-sdk";

import { toAccountAddressString } from "../../utils/account-address";
import { getAptosClient } from "../../utils/aptos-client";
import { OBJECT_CORE_TYPE_TAG_STRUCT } from "../../utils/type-tags";
import type {
  AccountAddressString,
  MoveObject,
  ObjectAddress,
  ObjectAddressStruct,
  TypeTagInput,
  Uint64String,
} from "..";
import {
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
  ViewFunctionPayloadBuilder,
} from "../payload-builders";

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

export type PrimaryStoreAddressPayloadMoveArguments = {
  owner: AccountAddress;
  metadata: MoveObject;
};

/**
 *```
 *  #[view]
 *  public fun primary_store_address<T: key>(
 *     owner: address,
 *     metadata: Object<T>,
 *  ): address
 *```
 **/

export class PrimaryStoreAddress extends ViewFunctionPayloadBuilder<[AccountAddressString]> {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "primary_fungible_store";

  public readonly functionName = "primary_store_address";

  public readonly args: PrimaryStoreAddressPayloadMoveArguments;

  // typeTags: [TypeTagInput]; // [T: key], just use `0x1::object::ObjectCore`.
  // The only reason to use anything else for the generic `Object<T>` type is to ensure `T`
  // exists, but that's not the point of this view function.
  public readonly typeTags: [TypeTag] = [OBJECT_CORE_TYPE_TAG_STRUCT];

  constructor(args: {
    owner: AccountAddressInput; // address
    metadata: ObjectAddress; // Object<T>
  }) {
    super();
    const { owner, metadata } = args;

    this.args = {
      owner: AccountAddress.from(owner),
      metadata: AccountAddress.from(metadata),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    owner: AccountAddressInput; // address
    metadata: ObjectAddress; // Object<T>
    options?: LedgerVersionArg;
  }): Promise<AccountAddressString> {
    const [res] = await new PrimaryStoreAddress(args).view(args);
    return toAccountAddressString(res);
  }
}

export type MigrateCoinStoreToFungibleStorePayloadMoveArguments = {
  accounts: MoveVector<AccountAddress>;
};

/**
 *```
 *  public entry fun migrate_coin_store_to_fungible_store<CoinType>(
 *     accounts: vector<address>,
 *  )
 *```
 **/

export class MigrateCoinStoreToFungibleStore extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "coin";

  public readonly functionName = "migrate_coin_store_to_fungible_store";

  public readonly args: MigrateCoinStoreToFungibleStorePayloadMoveArguments;

  public readonly typeTags: [TypeTag]; // [CoinType]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    primarySender: AccountAddressInput; // Not an entry function argument, but required to submit.
    accounts: Array<AccountAddressInput>; // vector<address>
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { primarySender, accounts, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(primarySender);
    this.args = {
      accounts: new MoveVector(accounts.map((argA) => AccountAddress.from(argA))),
    };
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    primarySender: AccountAddressInput; // sender for the payload, not used in the entry function as an argument
    accounts: Array<AccountAddressInput>; // vector<address>
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
    primarySender: Account; // Sender for the payload, not used in the entry function as an argument.
    accounts: Array<AccountAddressInput>; // vector<address>
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { primarySender: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await MigrateCoinStoreToFungibleStore.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      primarySender: primarySigner.accountAddress,
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
 *  public entry fun migrate_to_fungible_store<CoinType>()
 *     account: &signer,
 *```
 **/

export class MigrateToFungibleStore extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "coin";

  public readonly functionName = "migrate_to_fungible_store";

  public readonly args: Record<string, never>;

  public readonly typeTags: [TypeTag]; // [CoinType]

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    account: AccountAddressInput; // &signer
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { account, typeTags, feePayer } = args;
    this.primarySender = AccountAddress.from(account);

    this.args = {};
    this.typeTags = typeTags.map((typeTag) =>
      typeof typeTag === "string" ? parseTypeTag(typeTag) : typeTag
    ) as [TypeTag];
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    account: AccountAddressInput; // &signer
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
    account: Account; // &signer
    typeTags: [TypeTagInput]; // [CoinType]
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { account: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await MigrateToFungibleStore.builder({
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

export type StoreMetadataPayloadMoveArguments = {
  store: MoveObject;
};

/**
 *```
 *  #[view]
 *  public fun store_metadata<T: key>(
 *     store: Object<T>,
 *  ): Object<aptos_framework::fungible_asset::Metadata>
 *
 * NOTE: This uses `0x1::object::ObjectCore` as the type tag generic.
 *```
 **/

export class StoreMetadata extends ViewFunctionPayloadBuilder<[ObjectAddressStruct]> {
  public readonly moduleAddress = AccountAddress.ONE;

  public readonly moduleName = "fungible_asset";

  public readonly functionName = "store_metadata";

  public readonly args: StoreMetadataPayloadMoveArguments;

  // Same explanation as the `typeTags` in `PrimaryStoreAddress` above.
  public readonly typeTags: [TypeTag] = [OBJECT_CORE_TYPE_TAG_STRUCT];

  constructor(args: {
    store: ObjectAddress; // Object<T>
  }) {
    super();
    const { store } = args;

    this.args = {
      store: AccountAddress.from(store),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    store: ObjectAddress; // Object<T>
    options?: LedgerVersionArg;
  }): Promise<ObjectAddressStruct> {
    const [res] = await new StoreMetadata(args).view(args);
    return res;
  }
}
