import { Aptos, AptosConfig, type ClientConfig } from "@aptos-labs/ts-sdk";
import { APTOS_API_KEY, APTOS_NETWORK } from "../const";

export const APTOS_CONFIG: Partial<ClientConfig> = {
  API_KEY: APTOS_API_KEY,
};

export function getAptosClient(additionalConfig?: Partial<AptosConfig>): {
  aptos: Aptos;
  config: AptosConfig;
} {
  const network = APTOS_NETWORK;
  const config = new AptosConfig({
    network,
    ...additionalConfig,
    ...APTOS_CONFIG,
  });
  const aptos = new Aptos(config);
  return { aptos, config };
}
