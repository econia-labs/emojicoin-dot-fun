import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL, ONE_APT, deriveEmojicoinPublisherAddress, getRegistryAddress, sleep } from "../../src";
import { getTestHelpers } from "../utils";
import { MOCK_DATA_MARKET_EMOJIS, generateMockData } from "../utils/generate-mock-data";
import { getMarketResource } from "../../src/types/contract";

jest.setTimeout(10000000);

describe("tests a simple faucet fund account request", () => {
  const { aptos, publisher } = getTestHelpers();

  beforeAll(async () => {
    await aptos.fundAccount({ accountAddress: publisher.accountAddress, amount: 1000000 * ONE_APT });
  });

  it("should have things", async () => {
    await generateMockData(aptos, publisher);

    const registryAddress = await getRegistryAddress({
      aptos,
      moduleAddress: publisher.accountAddress,
    });

    const derivedNamedObjectAddress = deriveEmojicoinPublisherAddress({
      registryAddress,
      emojis: MOCK_DATA_MARKET_EMOJIS,
    });

    const marketObjectMarketResource = await getMarketResource({
      aptos,
      moduleAddress: publisher.accountAddress,
      objectAddress: derivedNamedObjectAddress,
    });

    const postgrest = new PostgrestClient(INBOX_URL);

    // Wait to make sure events were processed and saved by Inbox.
    await sleep(1000);

    // Get swaps on one market.
    const res = await postgrest
      .from("inbox_events")
      .select("*")
      .like("indexed_type", "%::emojicoin_dot_fun::Swap")
      .eq("data->>market_id", `${marketObjectMarketResource.metadata.marketID}`);

    expect(res.data).toBeDefined();

    let data = res.data!;

    expect(data.length).toBe(104);

    let expectedSum = 0n;
    for(let i = 1n; i <= 100n; i++) {
      expectedSum += i;
    }
    expectedSum *= BigInt(ONE_APT) * 100n;
    expectedSum += BigInt(ONE_APT);
    expectedSum += BigInt(ONE_APT) * 100000n;
    expectedSum += BigInt(ONE_APT) * 2000n;
    expectedSum += BigInt(ONE_APT) * 10n;
    let sum = data.reduce((prev,curr) => prev + BigInt(curr.data.quote_volume), 0n);
    expect(sum).toBe(expectedSum);
  });
});
