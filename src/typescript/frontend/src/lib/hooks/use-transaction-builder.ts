import { type AccountAddressInput, type AptosConfig } from "@aptos-labs/ts-sdk";
import { type InputGenerateTransactionOptions } from "@aptos-labs/wallet-adapter-core";
import {
  type WalletInputTransactionData,
  type EntryFunctionTransactionBuilder,
} from "@sdk/emojicoin_dot_fun/payload-builders";
import { useEffect, useState } from "react";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { doNotCallThisFunctionDirectly_serverSideLog } from "lib/utils/server-logs/log-to-server";
import { logToServer } from "lib/utils/server-logs/wrapper";

type BuilderConfig = {
  aptosConfig: AptosConfig;
  feePayer?: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
};

type StaticBuilder<Args extends BuilderConfig> = {
  builder(args: Args): Promise<EntryFunctionTransactionBuilder>;
};

/**
 * The transaction builder for the `submit` function in the wallet adapter ignores all options
 * suggested, because the wallet itself decides how to handle those options. This is because the
 * `submit` function requires JSON-like args to properly send a message through the extension
 * message transport.
 *
 * Because of this, it's useless to send things like suggested gas amount, account sequence number,
 * and gas unit price in the payload.
 *
 * Previously, this function would *waste up to 150ms fetching information that was literally thrown
 * away*. This call now takes only 5-6ms and doesn't waste a call to the fullnode REST API.
 *
 * If you'd like to send those configuration options, @see {@link useTransactionBuilderWithOptions}
 */
export function useTransactionBuilder<
  AllArgs extends Parameters<BuilderClass["builder"]>[0],
  BuilderClass extends StaticBuilder<BuilderConfig>,
  ArgsWithoutConfig extends Omit<AllArgs, "aptosConfig" | "feePayer" | "options"> | null,
>(
  memoizedArgs: ArgsWithoutConfig, // Ensure these args are properly memoized.
  builderClass: BuilderClass
): WalletInputTransactionData | null {
  const { aptos } = useAptos();
  const [inputData, setInputData] = useState<WalletInputTransactionData | null>(null);

  useEffect(() => {
    // Set the builder to `null` while it's fetching or while the params are invalid.
    setInputData(null);
    if (!memoizedArgs) {
      return;
    }
    // Ensure values are passed to sequence number and gas args so that they are not fetched from
    // on-chain or in gas simulations, because they are ultimately ignored by the receiving wallet
    // anyway, since the "submit" flow uses the JSON args input style submission.
    builderClass
      .builder({
        ...memoizedArgs,
        aptosConfig: aptos.config,
        feePayer: undefined,
        options: {
          accountSequenceNumber: 1n,
          maxGasAmount: 1,
          gasUnitPrice: 1,
          expireTimestamp: undefined,
        },
      })
      .then((builder) => builder.payloadBuilder.toInputPayload())
      .then(setInputData)
      .catch(() => setInputData(null));
  }, [aptos, builderClass, memoizedArgs]);

  return inputData;
}

const REBUILD_INTERVAL_SECONDS = 10;

/**
 * This hook exists to provide a solution for fixing the issue with Aptos Connect on Firefox/Safari.
 *
 * The reason this is necessary at all is two-fold:
 * 1. The `register_market` function needs explicit gas parameters on the first market registration.
 * 2. It's not possible to send gas parameters unless the transaction submission flow is `sign` and
 *    THEN `submit`, not `signAndSubmit` in one go.
 *
 * 1. Why does it need explicit gas parameters?
 *
 * The first market registration needs explicit gas parameters because it requires significantly
 * higher gas than a normal transaction due to instantiating the table of all viable symbol emojis
 * on chain.
 *
 * 2. Why did Firefox/Safari not work on Aptos Connect?
 *
 * Firefox/Safari was failing to submit with Aptos Connect (prior to this function) because they
 * both have strict pop-up rules on mobile devices. They stipulate that a pop-up can't occur from a
 * button click in a promise.
 *
 * Since the builder was called as a Promise alongside `submit` in the `handleClick` function for
 * any transaction submission, Firefox/Safari would block the pop-up, and thus the transaction
 * submission flow didn't work in those browsers on mobile.
 * @param memoizedArgs
 * @param builderClass
 * @param options
 * @returns
 */
export function useTransactionBuilderWithOptions<
  AllArgs extends Parameters<BuilderClass["builder"]>[0],
  BuilderClass extends StaticBuilder<BuilderConfig>,
  ArgsWithoutConfig extends Omit<AllArgs, "aptosConfig" | "feePayer" | "options"> | null,
>(
  memoizedArgs: ArgsWithoutConfig, // Ensure these args are properly memoized.
  builderClass: BuilderClass,
  options?: InputGenerateTransactionOptions & { feePayer?: AccountAddressInput }
): EntryFunctionTransactionBuilder | null {
  const { aptos } = useAptos();
  const [builder, setBuilder] = useState<EntryFunctionTransactionBuilder | null>(null);

  // Using the `setInterval` in this function resulted in stale values in the callback scope, so
  // to make it simple, just use an incrementing nonce to refresh the built payload on an interval.
  const nonce = useIncrementingNonce(REBUILD_INTERVAL_SECONDS * 1000);

  useEffect(() => {
    // Set the builder to `null` while it's fetching or while the params are invalid.
    setBuilder(null);
    if (!memoizedArgs || !options) {
      return;
    }
    // The `feePayer` and `options` args are respected by the transaction submission flow here,
    // so ensure they are actually passed to the builder function.
    builderClass
      .builder({
        ...memoizedArgs,
        aptosConfig: aptos.config,
        feePayer: options?.feePayer,
        options: {
          ...options,
          // Expire the transaction `REBUILD_INTERVAL_SECONDS` * 2 seconds after it's rebuilt, so
          // there is always a buffer of time before the transaction expires.
          expireTimestamp: Math.floor(Date.now() / 1000) + REBUILD_INTERVAL_SECONDS * 2,
        },
      })
      .then(setBuilder)
      .catch(() => setBuilder(null));
  }, [aptos, builderClass, memoizedArgs, options, nonce]);

  return builder;
}

const useIncrementingNonce = (intervalTime: number) => {
  const [nonce, setNonce] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => setNonce((n) => n + 1), intervalTime);
    return () => clearInterval(interval);
  });

  return nonce;
};
