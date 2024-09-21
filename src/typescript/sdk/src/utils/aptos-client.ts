import { Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

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
    throw new Error("NEXT_PUBLIC_APTOS_NETWORK environment variable is not set.");
  }
  return networkRaw ? NetworkToNetworkName[networkRaw] : Network.LOCAL;
}
