/* eslint-disable max-len */
import {
  AccountAddress,
  MoveString,
  MoveVector,
  type Account,
  Aptos,
  type AptosConfig,
  type AccountAddressInput,
  buildTransaction,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  type UserTransactionResponse,
  type MoveValue,
  type LedgerVersionArg,
} from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS } from "../../const";
import {
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
  ViewFunctionPayloadBuilder,
} from "../payload-builders";
import { type Option, type AccountAddressString } from "../types";

export type AddAdminPayloadMoveArguments = {
  newAdmin: AccountAddress;
};

/**
 *```
 *  public entry fun add_admin(
 *     admin: &signer,
 *     new_admin: address,
 *  )
 *```
 * */

export class AddAdmin extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "add_admin";

  public readonly args: AddAdminPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    admin: AccountAddressInput; // &signer
    newAdmin: AccountAddressInput; // address
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { admin, newAdmin, feePayer } = args;
    this.primarySender = AccountAddress.from(admin);

    this.args = {
      newAdmin: AccountAddress.from(newAdmin),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    admin: AccountAddressInput; // &signer
    newAdmin: AccountAddressInput; // address
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
    admin: Account; // &signer
    newAdmin: AccountAddressInput; // address
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { admin: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await AddAdmin.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      admin: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type AddMarketPropertiesPayloadMoveArguments = {
  market: AccountAddress;
  keys: MoveVector<MoveString>;
  values: MoveVector<MoveString>;
};

/**
 *```
 *  public entry fun add_market_properties(
 *     admin: &signer,
 *     market: address,
 *     keys: vector<String>,
 *     values: vector<String>,
 *  )
 *```
 * */

export class AddMarketProperties extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "add_market_properties";

  public readonly args: AddMarketPropertiesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    admin: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    values: Array<string>; // vector<String>
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { admin, market, keys, values, feePayer } = args;
    this.primarySender = AccountAddress.from(admin);

    this.args = {
      market: AccountAddress.from(market),
      keys: new MoveVector(keys.map((argA) => new MoveString(argA))),
      values: new MoveVector(values.map((argA) => new MoveString(argA))),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    admin: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    values: Array<string>; // vector<String>
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
    admin: Account; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    values: Array<string>; // vector<String>
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { admin: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await AddMarketProperties.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      admin: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type RemoveAdminPayloadMoveArguments = {
  adminToRemove: AccountAddress;
};

/**
 *```
 *  public entry fun remove_admin(
 *     admin: &signer,
 *     admin_to_remove: address,
 *  )
 *```
 * */

export class RemoveAdmin extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "remove_admin";

  public readonly args: RemoveAdminPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    admin: AccountAddressInput; // &signer
    adminToRemove: AccountAddressInput; // address
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { admin, adminToRemove, feePayer } = args;
    this.primarySender = AccountAddress.from(admin);

    this.args = {
      adminToRemove: AccountAddress.from(adminToRemove),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    admin: AccountAddressInput; // &signer
    adminToRemove: AccountAddressInput; // address
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
    admin: Account; // &signer
    adminToRemove: AccountAddressInput; // address
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { admin: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await RemoveAdmin.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      admin: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type RemoveMarketPropertiesPayloadMoveArguments = {
  market: AccountAddress;
  keys: MoveVector<MoveString>;
};

/**
 *```
 *  public entry fun remove_market_properties(
 *     admin: &signer,
 *     market: address,
 *     keys: vector<String>,
 *  )
 *```
 * */

export class RemoveMarketProperties extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "remove_market_properties";

  public readonly args: RemoveMarketPropertiesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    admin: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { admin, market, keys, feePayer } = args;
    this.primarySender = AccountAddress.from(admin);

    this.args = {
      market: AccountAddress.from(market),
      keys: new MoveVector(keys.map((argA) => new MoveString(argA))),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    admin: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
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
    admin: Account; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { admin: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await RemoveMarketProperties.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      admin: primarySigner.accountAddress,
    });
    const response = await transactionBuilder.submit({
      primarySigner,
      feePayer,
      options: waitForTransactionOptions,
    });
    return response;
  }
}

export type SetMarketPropertiesPayloadMoveArguments = {
  market: AccountAddress;
  keys: MoveVector<MoveString>;
  values: MoveVector<MoveString>;
};

/**
 *```
 *  public entry fun set_market_properties(
 *     admin: &signer,
 *     market: address,
 *     keys: vector<String>,
 *     values: vector<String>,
 *  )
 *```
 * */

export class SetMarketProperties extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "set_market_properties";

  public readonly args: SetMarketPropertiesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    admin: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    values: Array<string>; // vector<String>
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { admin, market, keys, values, feePayer } = args;
    this.primarySender = AccountAddress.from(admin);

    this.args = {
      market: AccountAddress.from(market),
      keys: new MoveVector(keys.map((argA) => new MoveString(argA))),
      values: new MoveVector(values.map((argA) => new MoveString(argA))),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    admin: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    values: Array<string>; // vector<String>
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
    admin: Account; // &signer
    market: AccountAddressInput; // address
    keys: Array<string>; // vector<String>
    values: Array<string>; // vector<String>
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { admin: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await SetMarketProperties.builder({
      ...args,
      feePayer: feePayer ? feePayer.accountAddress : undefined,
      admin: primarySigner.accountAddress,
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
 *  public fun admins(): vector<address>
 *```
 * */

export class Admins extends ViewFunctionPayloadBuilder<[Array<AccountAddressString>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "admins";

  public readonly args: Record<string, never>;

  public readonly typeTags: [] = [];

  constructor() {
    super();

    this.args = {};
  }

  static async submit(args: {
    aptos: Aptos | AptosConfig;
    options?: LedgerVersionArg;
  }): Promise<Array<AccountAddressString>> {
    const [res] = await new Admins().view(args);
    return res;
  }
}

export type MarketPropertiesPayloadMoveArguments = {
  market: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun market_properties(
 *     market: address,
 *  ): Option<aptos_framework::simple_map::SimpleMap>
 *```
 * */

export class MarketProperties extends ViewFunctionPayloadBuilder<[Option<MoveValue>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "market_properties";

  public readonly args: MarketPropertiesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    market: AccountAddressInput; // address
  }) {
    super();
    const { market } = args;

    this.args = {
      market: AccountAddress.from(market),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    market: AccountAddressInput; // address
    options?: LedgerVersionArg;
  }): Promise<Option<MoveValue>> {
    const [res] = await new MarketProperties(args).view(args);
    return res;
  }
}

export type MarketPropertyPayloadMoveArguments = {
  market: AccountAddress;
  property: MoveString;
};

/**
 *```
 *  #[view]
 *  public fun market_property(
 *     market: address,
 *     property: String,
 *  ): Option<String>
 *```
 * */

export class MarketProperty extends ViewFunctionPayloadBuilder<[Option<string>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_market_metadata";

  public readonly functionName = "market_property";

  public readonly args: MarketPropertyPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    market: AccountAddressInput; // address
    property: string; // String
  }) {
    super();
    const { market, property } = args;

    this.args = {
      market: AccountAddress.from(market),
      property: new MoveString(property),
    };
  }

  static async submit(args: {
    aptos: Aptos | AptosConfig;
    market: AccountAddressInput; // address
    property: string; // String
    options?: LedgerVersionArg;
  }): Promise<Option<string>> {
    const [res] = await new MarketProperty(args).view(args);
    return res;
  }
}
