/* eslint-disable import/no-unused-modules */ // Used in the frontend repo.
/* eslint-disable @typescript-eslint/no-var-requires */
import { NetworkToFaucetAPI, NetworkToIndexerAPI, NetworkToNodeAPI } from "@aptos-labs/ts-sdk";
import { Aptos, AptosConfig, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { APTOS_CONFIG } from "@sdk/utils/aptos-client";
import { APTOS_NETWORK } from "lib/env";

const toDockerUrl = (url: string) => url.replace("127.0.0.1", "host.docker.internal");

// Get an Aptos config based off of the network environment variables and the default APTOS_CONFIG
// client configuration/settings.
export const getAptosConfig = (): AptosConfig => {
  const networkString = APTOS_NETWORK;
  const clientConfig = APTOS_CONFIG;
  if (networkString === "local" && typeof window === "undefined") {
    const fs = require("node:fs");
    if (fs.existsSync("/.dockerenv")) {
      return new AptosConfig({
        network: NetworkToNetworkName["local"],
        fullnode: toDockerUrl(NetworkToNodeAPI["local"]),
        indexer: toDockerUrl(NetworkToIndexerAPI["local"]),
        faucet: toDockerUrl(NetworkToFaucetAPI["local"]),
        clientConfig,
      });
    }
  }
  const network = NetworkToNetworkName[networkString ?? APTOS_NETWORK];
  const fullnode = NetworkToNodeAPI[network];
  const indexer = NetworkToIndexerAPI[network];
  const faucet = NetworkToFaucetAPI[network];
  if (!network) {
    throw new Error(`Invalid network: ${networkString}`);
  }
  return new AptosConfig({ network, fullnode, indexer, faucet, clientConfig });
};

// Get an Aptos client based off of the network environment variables.
export const getAptos = (): Aptos => {
  const cfg = getAptosConfig();
  return new Aptos(cfg);
};
