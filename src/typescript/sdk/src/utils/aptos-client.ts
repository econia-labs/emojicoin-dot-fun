import {
  Aptos,
  AptosConfig,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  NetworkToNetworkName,
  NetworkToNodeAPI,
  type ClientConfig,
} from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK, getAptosApiKey } from "../const";

export const APTOS_CONFIG: Partial<ClientConfig> = {
  API_KEY: getAptosApiKey(),
};

const toDockerUrl = (url: string) => url.replace("127.0.0.1", "host.docker.internal");

export function getAptosClient(additionalConfig?: Partial<AptosConfig>): Aptos {
  const network = APTOS_NETWORK;
  let config = new AptosConfig({
    network,
    ...additionalConfig,
    clientConfig: {
      ...APTOS_CONFIG,
      ...additionalConfig?.clientConfig,
    },
  });
  if (network === "local" && typeof window === "undefined") {
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const fs = require("node:fs");
    if (fs.existsSync("/.dockerenv")) {
      config = new AptosConfig({
        network: NetworkToNetworkName["local"],
        fullnode: toDockerUrl(NetworkToNodeAPI["local"]),
        indexer: toDockerUrl(NetworkToIndexerAPI["local"]),
        faucet: toDockerUrl(NetworkToFaucetAPI["local"]),
        clientConfig: {
          ...APTOS_CONFIG,
          ...additionalConfig?.clientConfig,
        },
      });
    }
  }
  return new Aptos(config);
}
