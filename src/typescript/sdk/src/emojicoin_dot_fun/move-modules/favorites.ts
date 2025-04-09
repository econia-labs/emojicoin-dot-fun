/* eslint-disable max-len */
import {
  type Account,
  AccountAddress,
  type AccountAddressInput,
  Aptos,
  type AptosConfig,
  buildTransaction,
  type HexInput,
  type InputGenerateTransactionOptions,
  type LedgerVersionArg,
  MoveVector,
  type U8,
  type UserTransactionResponse,
  type WaitForTransactionOptions,
} from "@aptos-labs/ts-sdk";

import { MODULE_ADDRESS } from "../../const";
import {
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
  ViewFunctionPayloadBuilder,
} from "../payload-builders";

export type AddFavoritePayloadMoveArguments = {
  symbolBytes: MoveVector<U8>;
};

/**
 *```
 *  public entry fun add_favorite(
 *     user: &signer,
 *     symbol_bytes: vector<u8>,
 *  )
 *```
 **/

export class AddFavorite extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_favorites";

  public readonly functionName = "add_favorite";

  public readonly args: AddFavoritePayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    user: AccountAddressInput; // &signer
    symbolBytes: HexInput; // vector<u8>
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, symbolBytes, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {
      symbolBytes: MoveVector.U8(symbolBytes),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    symbolBytes: HexInput; // vector<u8>
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
    symbolBytes: HexInput; // vector<u8>
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { user: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await AddFavorite.builder({
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

export type RemoveFavoritePayloadMoveArguments = {
  symbolBytes: MoveVector<U8>;
};

/**
 *```
 *  public entry fun remove_favorite(
 *     user: &signer,
 *     symbol_bytes: vector<u8>,
 *  )
 *```
 **/

export class RemoveFavorite extends EntryFunctionPayloadBuilder {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_favorites";

  public readonly functionName = "remove_favorite";

  public readonly args: RemoveFavoritePayloadMoveArguments;

  public readonly typeTags: [] = [];

  public readonly primarySender: AccountAddress;

  public readonly secondarySenders: [] = [];

  public readonly feePayer?: AccountAddress;

  private constructor(args: {
    user: AccountAddressInput; // &signer
    symbolBytes: HexInput; // vector<u8>
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, symbolBytes, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {
      symbolBytes: MoveVector.U8(symbolBytes),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    symbolBytes: HexInput; // vector<u8>
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
    symbolBytes: HexInput; // vector<u8>
    feePayer?: Account;
    options?: InputGenerateTransactionOptions;
    waitForTransactionOptions?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { user: primarySigner, waitForTransactionOptions, feePayer } = args;

    const transactionBuilder = await RemoveFavorite.builder({
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

export type ViewFavoritesPayloadMoveArguments = {
  user: AccountAddress;
};

/**
 *```
 *  #[view]
 *  public fun view_favorites(
 *     user: address,
 *  ): vector<vector<u8>>
 *```
 **/

export class ViewFavorites extends ViewFunctionPayloadBuilder<[Array<string>]> {
  public readonly moduleAddress = MODULE_ADDRESS;

  public readonly moduleName = "emojicoin_dot_fun_favorites";

  public readonly functionName = "view_favorites";

  public readonly args: ViewFavoritesPayloadMoveArguments;

  public readonly typeTags: [] = [];

  constructor(args: {
    user: AccountAddressInput; // address
  }) {
    super();
    const { user } = args;

    this.args = {
      user: AccountAddress.from(user),
    };
  }

  static async view(args: {
    aptos: Aptos | AptosConfig;
    user: AccountAddressInput; // address
    options?: LedgerVersionArg;
  }): Promise<Array<string>> {
    const [res] = await new ViewFavorites(args).view(args);
    return res;
  }
}
