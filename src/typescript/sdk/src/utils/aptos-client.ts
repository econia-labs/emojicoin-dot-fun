import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

// Get the aptos client based off of the network environment variables.
/* eslint-disable-next-line import/no-unused-modules */
export const getAptos = (networkString: string): Aptos => {
  // Check if it's a valid network.
  const network = NetworkToNetworkName[networkString];
  if (!network) {
    throw new Error(`Invalid network: ${networkString}`);
  }
  const cfg = new AptosConfig({ network });
  return new Aptos(cfg);
};
