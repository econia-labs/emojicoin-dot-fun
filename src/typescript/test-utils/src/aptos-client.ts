import { Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

/* eslint-disable import/no-unused-modules */
export function getAptosClient(additionalConfig?: Partial<AptosConfig>): {
  aptos: Aptos;
  config: AptosConfig;
} {
  const networkRaw = process.env.NEXT_PUBLIC_APTOS_NETWORK;
  const network = networkRaw ? NetworkToNetworkName[networkRaw] : Network.LOCAL;
  if (!network) {
    const r = networkRaw;
    throw new Error(
      `Unknown network, confirm NEXT_PUBLIC_APTOS_NETWORK environment variable is valid: ${r}`
    );
  }
  const config = new AptosConfig({
    network,
    ...additionalConfig,
  });
  const aptos = new Aptos(config);
  return { aptos, config };
}
