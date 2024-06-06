/* eslint-disable import/no-unused-modules */ // Used in the frontend repo.
import { Network } from "@aptos-labs/ts-sdk";
import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "lib/env";

// Get an Aptos config based off of the network environment variables.
export const getAptosConfig = (networkString?: string): AptosConfig => {
  // Check if it's a valid network.
  if (networkString?.toLowerCase() === "localhost") {
    networkString = Network.LOCAL;
  }
  const network = NetworkToNetworkName[networkString ?? APTOS_NETWORK];
  if (!network) {
    throw new Error(`Invalid network: ${networkString}`);
  }
  return new AptosConfig({ network });
};

// Get an Aptos client based off of the network environment variables.
export const getAptos = (networkString?: string): Aptos => {
  const cfg = getAptosConfig(networkString);
  return new Aptos(cfg);
};
