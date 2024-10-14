import {
  type Account,
  type InputGenerateTransactionOptions,
  type WaitForTransactionOptions,
  type AccountAddressInput,
  type Uint64,
} from "@aptos-labs/ts-sdk";

type Options = {
  feePayer?: Account;
  options?: InputGenerateTransactionOptions;
  waitForTransactionOptions?: WaitForTransactionOptions;
};

type AnyEmoji = string;

type ExtraSwapArgs = {
  isSell: boolean;
  inputAmount: Uint64;
  minOutputAmount: Uint64;
  integrator: AccountAddressInput;
  integratorFeeRateBPs: number;
};

type EmojicoinClientTypes = {
  Options: Options;
  AnyEmoji: AnyEmoji;
  ExtraSwapArgs: ExtraSwapArgs;
};

export default EmojicoinClientTypes;
