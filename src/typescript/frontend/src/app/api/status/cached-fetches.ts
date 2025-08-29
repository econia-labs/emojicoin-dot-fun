import { ProcessorType } from "@aptos-labs/ts-sdk";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { postgrest } from "@/sdk/indexer-v2/queries/client";
import type { DatabaseJsonType } from "@/sdk/indexer-v2/types/json-types";
import { TableName } from "@/sdk/indexer-v2/types/json-types";
import { getAptosClient } from "@/sdk/utils/aptos-client";

import fetchFullnodeRestApiHealth from "./fullnode-rest-api-health";

export const fetchCachedEmojicoinProcessorStatus = unstableCacheWrapper(
  async () =>
    await postgrest
      .from(TableName.ProcessorStatus)
      .select("processor, last_success_version, last_updated, last_transaction_timestamp")
      .limit(1)
      .single()
      .overrideTypes<DatabaseJsonType["processor_status"], { merge: false }>()
      .then((res) => {
        if (res.error) {
          console.error(res.error);
          console.error(res.status, res.statusText);
        }
        return res.data;
      }),
  "fetch-cached-emojicoin-processor-status-for-status-page",
  { revalidate: 2 }
);

export const fetchCachedAptosProcessorStatus = unstableCacheWrapper(
  () =>
    getAptosClient()
      .getProcessorStatus(ProcessorType.DEFAULT)
      .catch((e) => {
        console.error(e);
        return null;
      }),
  "fetch-cached-aptos-processor-status",
  { revalidate: 2 }
);

export const fetchCachedFullnodeRestApiHealth = unstableCacheWrapper(
  () =>
    fetchFullnodeRestApiHealth().catch((e) => {
      console.error(e);
      return null;
    }),
  "fetch-cached-fullnode-rest-api-health",
  { revalidate: 2 }
);
