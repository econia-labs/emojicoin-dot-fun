import {
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

export function getAptosClient(additionalConfig?: Partial<AptosConfig>): {
  aptos: Aptos;
  config: AptosConfig;
} {
  const networkRaw = process.env.APTOS_NETWORK;
  const network = networkRaw ? NetworkToNetworkName[networkRaw] : Network.LOCAL;
  if (!network) {
    throw new Error(
      `Unknown network, confirm the APTOS_NETWORK environment variable is valid: ${networkRaw}`
    );
  }
  const config = new AptosConfig({
    network,
    ...additionalConfig,
  });
  const aptos = new Aptos(config);
  return { aptos, config };
}
