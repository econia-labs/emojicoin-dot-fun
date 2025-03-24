import {
  Aptos,
  AptosApiType,
  AptosConfig,
  get,
  type GetAptosRequestOptions,
  NetworkToFaucetAPI,
  NetworkToIndexerAPI,
  NetworkToNetworkName,
  NetworkToNodeAPI,
  type ClientConfig,
  type MoveResource,
  type AccountAddressInput,
  type PaginationArgs,
  type LedgerVersionArg,
  AccountAddress,
} from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK, getAptosApiKey } from "../const";

export const APTOS_CONFIG: Partial<ClientConfig> = {
  API_KEY: getAptosApiKey(),
};

const toDockerUrl = (url: string) => url.replace("127.0.0.1", "host.docker.internal");

export function getAptosClient(additionalConfig?: Partial<AptosConfig>): Aptos {
  const network = APTOS_NETWORK;

  if (network === "local" && typeof window === "undefined") {
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const fs = require("node:fs");
    if (fs.existsSync("/.dockerenv")) {
      const config = new AptosConfig({
        network: NetworkToNetworkName["local"],
        fullnode: toDockerUrl(NetworkToNodeAPI["local"]),
        indexer: toDockerUrl(NetworkToIndexerAPI["local"]),
        faucet: toDockerUrl(NetworkToFaucetAPI["local"]),
        clientConfig: {
          ...APTOS_CONFIG,
          ...additionalConfig?.clientConfig,
        },
      });
      return new Aptos(config);
    }
  }

  const config = new AptosConfig({
    network,
    ...additionalConfig,
    clientConfig: {
      ...APTOS_CONFIG,
      ...additionalConfig?.clientConfig,
    },
  });
  return new Aptos(config);
}

/**
 * @see {@link https://fullnode.devnet.aptoslabs.com/v1/spec#/operations/get_account_resources#response-headers}
 */
type GetAccountResourceResponseHeaders = {
  "x-aptos-block-height": number;
  "x-aptos-chain-id": number;
  "x-aptos-epoch": number;
  "x-aptos-ledger-oldest-version": number;
  "x-aptos-ledger-timestampusec": number;
  "x-aptos-ledger-version": number;
  "x-aptos-oldest-block-height": number;
  "x-aptos-cursor"?: string;
  "x-aptos-gas-used"?: number;
};

/**
 * Exactly the same as `paginateWithObfuscatedCursor` but with headers returned.
 *
 * This allows us to get the exact version/timestamp of account resources when they were retrieved.
 *
 * @see {@link https://github.com/aptos-labs/aptos-ts-sdk/blob/4503a0a1e783491290257544ff11fd4d33656237/src/client/get.ts#L268}
 */
export async function paginateWithObfuscatedCursorAndHeaders<
  FullnodeResponse extends Record<string, unknown>[],
>(options: GetAptosRequestOptions) {
  const out: { version: bigint; timestamp: bigint; data: FullnodeResponse[number] }[] = [];

  let cursor: string | undefined;
  const requestParams = options.params as { offset?: string; limit?: number };
  const totalLimit = requestParams.limit;
  do {
    const response = await get<NonNullable<unknown>, FullnodeResponse>({
      type: AptosApiType.FULLNODE,
      aptosConfig: options.aptosConfig,
      originMethod: options.originMethod,
      path: options.path,
      params: requestParams,
      overrides: options.overrides,
    });
    /**
     * the cursor is a "state key" from the API perspective. Client
     * should not need to "care" what it represents but just use it
     * to query the next chunk of data.
     */
    const headers: GetAccountResourceResponseHeaders = response.headers;
    cursor = headers["x-aptos-cursor"];
    out.push(
      ...response.data.map((data) => ({
        version: BigInt(headers["x-aptos-ledger-version"]),
        timestamp: BigInt(headers["x-aptos-ledger-timestampusec"]),
        data,
      }))
    );
    requestParams.offset = cursor;

    // Re-evaluate length
    if (totalLimit !== undefined) {
      const newLimit = totalLimit - out.length;
      if (newLimit <= 0) {
        break;
      }
      requestParams.limit = newLimit;
    }
  } while (cursor !== null && cursor !== undefined);
  return out;
}

/**
 * Gets an account's resources, but with the ledger version and timestamp at the exact time the
 * resources were retrieved at.
 *
 * @see {@link https://github.com/aptos-labs/aptos-ts-sdk/blob/43420bb25573b9215f0386a8571f223b38d0da26/src/internal/account.ts#L161}
 * @see paginateWithObfuscatedCursorAndHeaders
 */
export const getAccountResourcesWithInfo = ({
  aptosConfig = getAptosClient().config,
  accountAddress,
  options,
}: {
  aptosConfig?: AptosConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs & LedgerVersionArg;
}) =>
  paginateWithObfuscatedCursorAndHeaders<MoveResource[]>({
    aptosConfig,
    originMethod: "getResources",
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/resources`,
    params: {
      ledger_version: options?.ledgerVersion,
      offset: options?.offset,
      limit: options?.limit ?? 999,
    },
  });
