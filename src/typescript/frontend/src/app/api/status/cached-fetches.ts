import { ProcessorType } from "@aptos-labs/ts-sdk";
import { unstable_cache } from "next/cache";

import { postgrest } from "@/sdk/indexer-v2/queries/client";
import type { DatabaseJsonType } from "@/sdk/indexer-v2/types/json-types";
import { TableName } from "@/sdk/indexer-v2/types/json-types";
import { getAptosClient } from "@/sdk/utils/aptos-client";

import fetchFullnodeRestApiHealth from "./fullnode-rest-api-health";

export const fetchCachedEmojicoinProcessorStatus = unstable_cache(
  async () =>
    postgrest
      .from(TableName.ProcessorStatus)
      .select("processor, last_success_version, last_updated, last_transaction_timestamp")
      .limit(1)
      .single()
      .overrideTypes<DatabaseJsonType["processor_status"], { merge: false }>()
      .then(({ data }) => data),
  [],
  { revalidate: 2, tags: ["fetch-cached-emojicoin-processor-status-for-status-page"] }
);

export const fetchCachedAptosProcessorStatus = unstable_cache(
  () =>
    getAptosClient()
      .getProcessorStatus(ProcessorType.DEFAULT)
      .catch(() => null),
  [],
  { revalidate: 2, tags: ["fetch-cached-aptos-processor-status"] }
);

export const fetchCachedFullnodeRestApiHealth = unstable_cache(
  () => fetchFullnodeRestApiHealth().catch(() => null),
  [],
  { revalidate: 2, tags: ["fetch-cached-fullnode-rest-api-health"] }
);
