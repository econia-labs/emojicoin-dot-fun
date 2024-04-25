/* eslint-disable no-prototype-builtins */
/* eslint-disable no-await-in-loop */
import {
  type Aptos,
  Account,
  type AccountAddress,
  EntryFunction,
  type EntryFunctionArgumentTypes,
  Identifier,
  ModuleId,
  MultiSig,
  TransactionPayloadEntryFunction,
  type TypeTag,
  type LedgerVersionArg,
  type UserTransactionResponse,
  type WaitForTransactionOptions,
  Serializable,
  type Serializer,
  type EntryFunctionPayloadResponse,
  type AnyRawTransaction,
  AccountAuthenticator,
  type SimpleEntryFunctionArgumentTypes,
  type InputViewFunctionData,
  TransactionPayloadMultiSig,
  MultiSigTransactionPayload,
  type MoveValue,
} from "@aptos-labs/ts-sdk";
import { type WalletSignTransactionFunction } from ".";

export class EntryFunctionTransactionBuilder {
  public readonly payloadBuilder: EntryFunctionPayloadBuilder;

  public readonly aptos: Aptos;

  public readonly rawTransactionInput: AnyRawTransaction;

  constructor(
    payloadBuilder: EntryFunctionPayloadBuilder,
    aptos: Aptos,
    rawTransactionInput: AnyRawTransaction
  ) {
    this.payloadBuilder = payloadBuilder;
    this.aptos = aptos;
    this.rawTransactionInput = rawTransactionInput;
  }

  /**
   *
   * @param signer either a local Account or a callback function that returns AccountAuthenticator.
   * @param asFeePayer whether or not the signer is the fee payer.
   * @returns Promise<AccountAuthenticator>
   */
  async sign(
    signer: Account | WalletSignTransactionFunction,
    asFeePayer?: boolean
  ): Promise<AccountAuthenticator> {
    if (signer.hasOwnProperty("privateKey") || signer instanceof Account) {
      const signingFunction = asFeePayer
        ? this.aptos.transaction.signAsFeePayer
        : this.aptos.transaction.sign;
      const accountAuthenticator = signingFunction({
        signer: signer as Account,
        transaction: this.rawTransactionInput,
      });
      return Promise.resolve(accountAuthenticator);
    }
    return signer(this.rawTransactionInput, asFeePayer);
  }

  // To be used by a static `submit` where the user enters named signer arguments.
  async submit(args: {
    primarySigner: Account | WalletSignTransactionFunction | AccountAuthenticator;
    secondarySigners?: Array<Account | WalletSignTransactionFunction | AccountAuthenticator>;
    feePayer?: Account | WalletSignTransactionFunction | AccountAuthenticator;
    options?: WaitForTransactionOptions;
  }): Promise<UserTransactionResponse> {
    const { primarySigner, secondarySigners, feePayer, options } = args;
    let primarySenderAuthenticator: AccountAuthenticator;
    let secondarySendersAuthenticators: Array<AccountAuthenticator> | undefined;
    let feePayerAuthenticator: AccountAuthenticator | undefined;
    if (primarySigner instanceof AccountAuthenticator) {
      primarySenderAuthenticator = primarySigner;
    } else {
      primarySenderAuthenticator = await this.sign(primarySigner);
    }
    if (secondarySigners) {
      secondarySendersAuthenticators = new Array<AccountAuthenticator>();
      for (const signer of secondarySigners) {
        if (signer instanceof AccountAuthenticator) {
          secondarySendersAuthenticators.push(signer);
        } else {
          secondarySendersAuthenticators.push(await this.sign(signer));
        }
      }
    }
    if (feePayer) {
      if (feePayer instanceof AccountAuthenticator) {
        feePayerAuthenticator = feePayer;
      } else {
        feePayerAuthenticator = await this.sign(feePayer, true);
      }
    }

    const pendingTransaction = await this.aptos.transaction.submit.multiAgent({
      transaction: this.rawTransactionInput,
      senderAuthenticator: primarySenderAuthenticator,
      feePayerAuthenticator,
      additionalSignersAuthenticators: secondarySendersAuthenticators ?? [],
    });

    const userTransactionResponse = await this.aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash,
      options,
    });

    return userTransactionResponse as UserTransactionResponse;
  }

  /**
   * Helper function to print out relevant transaction info with an easy way to filter out fields.
   *
   * These are intended to be chained declaratively. For example:
   *    const response = await builder.submit(...).responseInfo(["hash", "success"]);
   *
   * @param response The transaction response for a user submitted transaction.
   * @param optionsArray An array of keys to print out from the transaction response.
   * @returns the transaction info as an object.
   */
  /* eslint-disable-next-line class-methods-use-this */ // This is intended to be chained.
  responseInfo(
    response: UserTransactionResponse,
    optionsArray?: Array<keyof UserTransactionResponse>
  ) {
    const payload = response.payload as EntryFunctionPayloadResponse;

    const keysToPrint: Record<string, any> = {};
    for (const key of optionsArray ?? []) {
      keysToPrint[key] = response[key as keyof typeof response];
    }

    return {
      function: payload.function,
      arguments: payload.arguments,
      type_arguments: payload.type_arguments,
      hash: response.hash,
      version: response.version,
      sender: response.sender,
      success: response.success,
      ...keysToPrint,
    };
  }
}

export abstract class EntryFunctionPayloadBuilder extends Serializable {
  public abstract moduleAddress: AccountAddress;

  public abstract readonly moduleName: string;

  public abstract readonly functionName: string;

  public abstract readonly args: any;

  public abstract readonly typeTags: Array<TypeTag>;

  public abstract readonly primarySender: AccountAddress;

  public abstract readonly secondarySenders?: Array<AccountAddress>;

  public abstract readonly feePayer?: AccountAddress;

  createPayload(
    multisigAddress?: AccountAddress
  ): TransactionPayloadEntryFunction | TransactionPayloadMultiSig {
    const entryFunction = new EntryFunction(
      new ModuleId(this.moduleAddress, new Identifier(this.moduleName)),
      new Identifier(this.functionName),
      this.typeTags,
      this.argsToArray()
    );
    if (multisigAddress) {
      return new TransactionPayloadMultiSig(
        new MultiSig(multisigAddress, new MultiSigTransactionPayload(entryFunction))
      );
    }
    return new TransactionPayloadEntryFunction(entryFunction);
  }

  argsToArray(): Array<EntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }

  serialize(serializer: Serializer): void {
    this.createPayload().serialize(serializer);
  }
}

export abstract class ViewFunctionPayloadBuilder<T extends Array<MoveValue>> {
  public abstract moduleAddress: AccountAddress;

  public abstract readonly moduleName: string;

  public abstract readonly functionName: string;

  public abstract readonly args: any;

  public abstract readonly typeTags: Array<TypeTag>;

  toPayload(): InputViewFunctionData {
    return {
      function: `${this.moduleAddress.toString()}::${this.moduleName}::${this.functionName}`,
      typeArguments: this.typeTags.map(
        (type) => type.toString() as `0x${string}::${string}::${string}`
      ),
      functionArguments: this.argsToArray(),
    };
  }

  async submit(args: { aptos: Aptos; options?: LedgerVersionArg }): Promise<T> {
    const { aptos, options } = args;
    const viewRequest = await aptos.view<T>({
      payload: this.toPayload(),
      options,
    });
    return viewRequest;
  }

  argsToArray(): Array<SimpleEntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }
}
