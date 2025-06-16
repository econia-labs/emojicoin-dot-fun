import "server-only";

import { NetworkToNodeAPI } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "lib/env";
import { parseJSON } from "utils";

import { getAptosApiKey } from "@/sdk/index";

// The base response for the fullnode's `{fullnode_url}/v1` endpoint.
type FullnodeResponse = {
  chain_id: number;
  epoch: string;
  ledger_version: string;
  oldest_ledger_version: string;
  ledger_timestamp: string;
  node_role: string;
  oldest_block_height: string;
  block_height: string;
  git_hash: string;
};

const fullnodeURL = NetworkToNodeAPI[APTOS_NETWORK];

export default async function fetchFullnodeRestApiHealth() {
  const apiKey = getAptosApiKey();
  const requestInit = {
    headers: apiKey
      ? {
          authorization: `Bearer ${getAptosApiKey()}`,
        }
      : undefined,
  };
  const res = await fetch(fullnodeURL, requestInit)
    .then((res) => res.text())
    .then(parseJSON<FullnodeResponse>)
    .catch(console.error);
  return res;
}
