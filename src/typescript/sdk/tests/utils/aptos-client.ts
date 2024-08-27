import {
  type Account,
  AccountAddress,
  type AccountAddressInput,
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import { ONE_APT } from "../../src/const";

/* eslint-disable import/no-unused-modules */
export function getAptosClient(additionalConfig?: Partial<AptosConfig>): {
  aptos: Aptos;
  config: AptosConfig;
} {
  const network = getAptosNetwork();
  const config = new AptosConfig({
    network,
    ...additionalConfig,
  });
  const aptos = new Aptos(config);
  return { aptos, config };
}

export function getAptosNetwork(): Network {
  const networkRaw = process.env.NEXT_PUBLIC_APTOS_NETWORK;
  if (!networkRaw) {
    console.warn(
      "NEXT_PUBLIC_APTOS_NETWORK environment variable not set, defaulting to local network"
    );
  }
  return networkRaw ? NetworkToNetworkName[networkRaw] : Network.LOCAL;
}

/**
 * A faster way to fund an account if we're on a local network.
 * Otherwise, it will call the fundAccount method aptAmount times.
 */
export async function fundAccountFast(
  aptos: Aptos,
  maybeAddress: AccountAddressInput | Account,
  // Note that this is the display amount; i.e., 1 => 10^8 input amount on-chain.
  aptAmount: number | bigint
) {
  const isHexInput = typeof maybeAddress === "string" || maybeAddress instanceof Uint8Array;
  const accountAddress = AccountAddress.from(
    maybeAddress instanceof AccountAddress || isHexInput
      ? maybeAddress
      : maybeAddress.accountAddress
  );
  if (getAptosNetwork() === Network.LOCAL) {
    return [await aptos.fundAccount({ accountAddress, amount: Number(aptAmount) * ONE_APT })];
  }
  const results = Array.from({ length: Number(aptAmount) }).map(async () =>
    aptos.fundAccount({ accountAddress, amount: ONE_APT })
  );
  return Promise.all(results);
}
