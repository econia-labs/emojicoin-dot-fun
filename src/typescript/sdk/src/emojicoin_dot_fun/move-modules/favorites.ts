/* eslint-disable import/no-unused-modules */
import type {
  Account,
  AccountAddressInput,
  AptosConfig,
  InputGenerateTransactionOptions,
  LedgerVersionArg,
  UserTransactionResponse,
  WaitForTransactionOptions,
} from "@aptos-labs/ts-sdk";
import { AccountAddress, Aptos, buildTransaction } from "@aptos-labs/ts-sdk";

import { MODULE_ADDRESS } from "../../const";
import {
  EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
  ViewFunctionPayloadBuilder,
} from "../payload-builders";
import type { AccountAddressString } from "../types";

export type AddFavoritePayloadMoveArguments = {
  market: AccountAddress;
};

/**
 *```
 *  public entry fun add_favorite(
 *     user: &signer,
 *     market: address,
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
    market: AccountAddressInput; // address
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, market, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {
      market: AccountAddress.from(market),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
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
    market: AccountAddressInput; // address
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
  market: AccountAddress;
};

/**
 *```
 *  public entry fun remove_favorite(
 *     user: &signer,
 *     market: address,
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
    market: AccountAddressInput; // address
    feePayer?: AccountAddressInput; // Optional fee payer account to pay gas fees.
  }) {
    super();
    const { user, market, feePayer } = args;
    this.primarySender = AccountAddress.from(user);

    this.args = {
      market: AccountAddress.from(market),
    };
    this.feePayer = feePayer !== undefined ? AccountAddress.from(feePayer) : undefined;
  }

  static async builder(args: {
    aptosConfig: AptosConfig;
    user: AccountAddressInput; // &signer
    market: AccountAddressInput; // address
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
    market: AccountAddressInput; // address
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
 *  ): vector<address>
 *```
 **/

export class ViewFavorites extends ViewFunctionPayloadBuilder<[Array<AccountAddressString>]> {
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
  }): Promise<Array<AccountAddressString>> {
    const [res] = await new ViewFavorites(args).view(args);
    return res;
  }
}
