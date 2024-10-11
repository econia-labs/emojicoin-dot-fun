/* eslint-disable import/no-unused-modules */ // Used in the frontend repo.
import { NetworkToFaucetAPI, NetworkToIndexerAPI, NetworkToNodeAPI } from "@aptos-labs/ts-sdk";
import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "lib/env";

// Get an Aptos config based off of the network environment variables.
export const getAptosConfig = (): AptosConfig => {
  // Check if it's a valid network.
  const networkString = APTOS_NETWORK;
  console.log({ networkString });
  if ((networkString as string) === "docker") {
    return new AptosConfig({
      network: NetworkToNetworkName["custom"],
      fullnode: NetworkToNodeAPI["local"].replace("127.0.0.1", "host.docker.internal"),
      indexer: NetworkToIndexerAPI["local"].replace("127.0.0.1", "host.docker.internal"),
      faucet: NetworkToFaucetAPI["local"].replace("127.0.0.1", "host.docker.internal"),
    });
  }
  const network = NetworkToNetworkName[networkString ?? APTOS_NETWORK];
  const fullnode = NetworkToNodeAPI[network];
  const indexer = NetworkToIndexerAPI[network];
  const faucet = NetworkToFaucetAPI[network];
  if (!network) {
    throw new Error(`Invalid network: ${networkString}`);
  }
  return new AptosConfig({ network, fullnode, indexer, faucet });
};

// Get an Aptos client based off of the network environment variables.
export const getAptos = (): Aptos => {
  const cfg = getAptosConfig();
  console.log({ cfg });
  return new Aptos(cfg);
};
