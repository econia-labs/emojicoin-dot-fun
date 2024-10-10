import { sleep } from "../../../../src";
import { getLatestProcessedEmojicoinVersion, postgrest } from "../../../../src/indexer-v2/queries";
import { TableName } from "../../../../src/indexer-v2/types/json-types";
import { EMOJICOIN_INDEXER_URL } from "../../../../src/server/env";

const API_KEY = process.env.EMOJICOIN_INDEXER_API_KEY!;

const TESTNET = process.env.NEXT_PUBLIC_APTOS_NETWORK === "testnet";
// Skip these tests if the network isn't `testnet`.
(TESTNET ? describe : describe.skip)(
  "tests the usage of the api key for the indexer testnet deployment",
  () => {
    it("ensures the EMOJICOIN_INDEXER_URL does not end with a slash", () => {
      expect(EMOJICOIN_INDEXER_URL.endsWith("/")).toBe(false);
    });

    it("ensures all environment variables are properly set", () => {
      expect(process.env.NEXT_PUBLIC_APTOS_NETWORK).toEqual("testnet");
      expect(EMOJICOIN_INDEXER_URL.includes("localhost")).toBe(false);
      expect(EMOJICOIN_INDEXER_URL.includes("host.docker.internal")).toBe(false);

      const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL!;
      expect(brokerUrl).toBeDefined();
      expect(brokerUrl.includes("localhost")).toBe(false);
      expect(brokerUrl.includes("host.docker.internal")).toBe(false);
    });

    it("performs a simple fetch with the x-api-key header", async () => {
      expect(API_KEY).toBeDefined();
      const url = new URL("/processor_status", EMOJICOIN_INDEXER_URL);
      url.searchParams.set("select", "last_success_version");
      const res = await fetch(url, {
        headers: {
          "x-api-key": API_KEY,
        },
      });
      expect(res.status).toEqual(200);
      const json: [{ last_success_version: number }] = await res.json();
      const [data] = json;
      const { last_success_version: version } = data;
      expect(version).toBeGreaterThan(0);
    });

    it("performs a fetch for the latest processor version, without any query helpers", async () => {
      const version = await postgrest
        .from(TableName.ProcessorStatus)
        .select("last_success_version")
        .limit(1)
        .maybeSingle()
        .then(({ data }) => BigInt(data?.last_success_version ?? "0"));
      expect(version).toBeDefined();
      expect(version).toBeGreaterThanOrEqual(1);
    });

    it("uses the helper function to get the latest processor version", async () => {
      // If this test doesn't wait for 1 second, it seems we are rate-limited and get no data.
      await sleep(1000);
      const version = await getLatestProcessedEmojicoinVersion();
      expect(version).toBeDefined();
      expect(version).toBeGreaterThanOrEqual(1n);
    });
  }
);
