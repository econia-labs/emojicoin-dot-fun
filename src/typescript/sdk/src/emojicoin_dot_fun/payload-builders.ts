/* eslint-disable no-prototype-builtins */
/* eslint-disable no-await-in-loop */
import {
  type Aptos,
  type Account,
  type AccountAddress,
  EntryFunction,
  type EntryFunctionArgumentTypes,
  MultiSig,
  TransactionPayloadEntryFunction,
  type TypeTag,
  type LedgerVersionArg,
  type UserTransactionResponse,
  type WaitForTransactionOptions,
  Serializable,
  Serializer,
  type AnyRawTransaction,
  AccountAuthenticator,
  type InputViewFunctionData,
  TransactionPayloadMultiSig,
  MultiSigTransactionPayload,
  type MoveValue,
  MimeType,
  postAptosFullNode,
  type AptosConfig,
  type InputGenerateTransactionOptions,
  type AccountAddressInput,
  type InputEntryFunctionData,
} from "@aptos-labs/ts-sdk";
import { toConfig } from "../utils/aptos-utils";
import serializeArgsToJSON from "./serialize-args-to-json";

export class EntryFunctionTransactionBuilder {
  public readonly payloadBuilder: EntryFunctionPayloadBuilder;

  public readonly aptos: Aptos;

  public readonly rawTransactionInput: AnyRawTransaction;

  // TODO: This should probably be private, if it's possible.
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
   * @param signer a local Account or a callback function that returns an AccountAuthenticator.
   * @param asFeePayer whether or not the signer is the fee payer.
   * @returns a Promise<AccountAuthenticator>
   */
  async sign(signer: Account, asFeePayer?: boolean): Promise<AccountAuthenticator> {
    const signingFunction = asFeePayer
      ? this.aptos.transaction.signAsFeePayer
      : this.aptos.transaction.sign;
    const accountAuthenticator = signingFunction({
      signer: signer as Account,
      transaction: this.rawTransactionInput,
    });
    return Promise.resolve(accountAuthenticator);
  }

  // To be used by a static `submit` where the user enters named signer arguments.
  async submit(args: {
    primarySigner: Account | AccountAuthenticator;
    secondarySigners?: Array<Account | AccountAuthenticator>;
    feePayer?: Account | AccountAuthenticator;
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
          /* eslint-disable-next-line no-await-in-loop */
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

    const userTransactionResponse = (await this.aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash,
      options,
    })) as UserTransactionResponse;

    return userTransactionResponse;
  }
}

/* eslint-disable-next-line import/no-unused-modules */
export type WalletInputTransactionData = {
  sender?: AccountAddressInput;
  // For now we only use entry functions. Eventually we could support script functions, too.
  data: InputEntryFunctionData;
  options?: InputGenerateTransactionOptions;
};

export abstract class EntryFunctionPayloadBuilder extends Serializable {
  public abstract readonly moduleAddress: AccountAddress;

  public abstract readonly moduleName: string;

  public abstract readonly functionName: string;

  public abstract readonly args: Record<string, EntryFunctionArgumentTypes>;

  public abstract readonly typeTags: Array<TypeTag>;

  public abstract readonly primarySender: AccountAddress;

  public abstract readonly secondarySenders?: Array<AccountAddress>;

  public abstract readonly feePayer?: AccountAddress;

  createPayload(
    multisigAddress?: AccountAddress
  ): TransactionPayloadEntryFunction | TransactionPayloadMultiSig {
    const entryFunction = EntryFunction.build(
      `${this.moduleAddress.toString()}::${this.moduleName}`,
      this.functionName,
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

  toInputPayload(args?: {
    multisigAddress?: AccountAddress;
    options?: InputGenerateTransactionOptions;
  }): WalletInputTransactionData {
    const { multisigAddress, options } = args ?? {};
    const multiSigData =
      typeof multisigAddress !== "undefined"
        ? {
            multisigAddress,
          }
        : {};

    return {
      sender: this.primarySender,
      data: {
        ...multiSigData,
        function: `${this.moduleAddress.toString()}::${this.moduleName}::${this.functionName}`,
        typeArguments: this.typeTags.map((t) => t.toString()),
        functionArguments: serializeArgsToJSON(this.args),
        // abi: undefined, // TODO: Add pre-defined ABIs.
      },
      options,
    };
  }

  argsToArray(): Array<EntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }

  serialize(serializer: Serializer): void {
    this.createPayload().serialize(serializer);
  }
}

export abstract class ViewFunctionPayloadBuilder<T extends Array<MoveValue>> {
  public abstract readonly moduleAddress: AccountAddress;

  public abstract readonly moduleName: string;

  public abstract readonly functionName: string;

  public abstract readonly args: Record<string, EntryFunctionArgumentTypes>;

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

  async view(args: { aptos: Aptos | AptosConfig; options?: LedgerVersionArg }): Promise<T> {
    const entryFunction = EntryFunction.build(
      `${this.moduleAddress.toString()}::${this.moduleName}`,
      this.functionName,
      this.typeTags,
      this.argsToArray()
    );
    const { aptos, options } = args;
    const viewRequest = await postBCSViewFunction<T>({
      aptosConfig: aptos,
      payload: entryFunction,
      options,
    });
    return viewRequest as T;
  }

  argsToArray(): Array<EntryFunctionArgumentTypes> {
    return Object.keys(this.args).map((field) => this.args[field as keyof typeof this.args]);
  }
}

/* eslint-disable-next-line import/no-unused-modules */
export async function postBCSViewFunction<T extends Array<MoveValue>>(args: {
  aptosConfig: Aptos | AptosConfig;
  payload: EntryFunction;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { payload, options } = args;
  const aptosConfig = toConfig(args.aptosConfig);
  const serializer = new Serializer();
  payload.serialize(serializer);
  const bytes = serializer.toUint8Array();
  const { data } = await postAptosFullNode<Uint8Array, MoveValue[]>({
    aptosConfig,
    path: "view",
    originMethod: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
    body: bytes,
  });
  return data as T;
}
