import { test, expect, Response } from '@playwright/test';
import { NEXTJS_CACHE_HEADER, REVALIDATION_TIME } from "../util";
import { ONE_APT, sleep } from "@econia-labs/emojicoin-common";
import { getTestHelpers } from '@econia-labs/emojicoin-test-utils';
import { Account } from '@aptos-labs/ts-sdk';
import { EmojicoinDotFun, getRegistryAddress } from '@sdk/emojicoin_dot_fun';
import { getEmojicoinMarketAddressAndTypeTags } from '@sdk/index';

/**
  * In this test, we're going to test the caching of the /market/api endpoint.
  *
  * To do this, we're going to:
  *
  * 1. sort by bump, which will give us the latest markets that have been bumped.
  * 2. bump the second market from the response.
  * 3. wait for the changes to propagate.
  * 4. query the data again, and see the changes.
  */
test('test market api route', async ({ page }) => {
  const { aptos, publisher } = getTestHelpers();
  const randomIntegrator = Account.generate();
  const user = Account.generate();
  await aptos.fundAccount({ accountAddress: user.accountAddress, amount: ONE_APT });
  await aptos.fundAccount({ accountAddress: user.accountAddress, amount: ONE_APT });
  const endpoint = '/market/api?sortby=bump';

  const chatEmojis = [
    ["f09fa791e2808df09f9a80", "🧑‍🚀"], // Astronaut.
    ["f09fa6b8f09f8fbee2808de29982efb88f", "🦸🏾‍♂️"], // Man superhero: medium-dark skin tone.
    ["f09f92a9", "💩"], // Pile of poo.
    ["f09fa4a1", "🤡"], // Clown face.
    ["f09f91b9", "👹"], // Ogre.
    ["f09f91ba", "👺"], // Goblin.
    ["f09f91bb", "👻"], // Ghost.
    ["f09f91bd", "👽"], // Alien.
    ["f09fa496", "🤖"], // Robot.
  ];

  const blackCatEmoji = "f09f9088e2808de2ac9b";
  const clownFaceEmoji = "f09fa4a1";

  const txResponseBlackCat = await EmojicoinDotFun.RegisterMarket.submit({
    aptosConfig: aptos.config,
    registrant: user,
    emojis: [blackCatEmoji],
    integrator: randomIntegrator.accountAddress,
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
  });
  expect(txResponseBlackCat.success).toBe(true);
  const txResponseClownFace = await EmojicoinDotFun.RegisterMarket.submit({
    aptosConfig: aptos.config,
    registrant: user,
    emojis: [clownFaceEmoji],
    integrator: randomIntegrator.accountAddress,
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
  });
  expect(txResponseClownFace.success).toBe(true);

  let res1: Response;
  let res1headers: {
    [key: string]: string
  };

  // Query fresh data a first time.
  do {
    await sleep(100);
    res1 = (await page.goto(endpoint))!;
    res1headers = res1.headers();
  } while (res1headers[NEXTJS_CACHE_HEADER] === "STALE");
  const res1data = await res1.json();

  const firstMarket = res1data.markets[0];
  const secondMarket = res1data.markets[1];

  expect(firstMarket["marketID"]).not.toBe(secondMarket["marketID"])
  expect(firstMarket["bumpTime"]).toBeGreaterThanOrEqual(secondMarket["bumpTime"])

  // TODO: call contract and bump secondMarket
  // Get the registry address.
  const registryAddress = await getRegistryAddress({
    aptos,
    moduleAddress: publisher.accountAddress,
  });

  // Get the black cat emojicoin market address and TypeTags.
  const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes: blackCatEmoji,
  });

  const chatResponse = await EmojicoinDotFun.Chat.submit({
    aptosConfig: aptos.config,
    user,
    marketAddress,
    emojiBytes: chatEmojis.map(([hex, _]) => hex),
    emojiIndicesSequence: new Uint8Array([0, 1]),
    typeTags: [emojicoin, emojicoinLP],
  });
  expect(chatResponse.success).toBe(true);

  // Query a second. This should return stale data.
  await sleep(REVALIDATION_TIME);
  const res2 = (await page.goto(endpoint))!;
  const res2headers = res2.headers();
  const res2text = await res2.text();

  expect(res2text).toBe(JSON.stringify(res1data));
  expect(res2headers[NEXTJS_CACHE_HEADER]).toBe("STALE");

  // Query a third to get the fresh data.
  await sleep(200);

  const res3 = (await page.goto(endpoint))!;
  const res3headers = res3.headers();
  const res3data = await res3.json();

  const newFirstMarket = res3data.markets[0];
  const newSecondMarket = res3data.markets[1];

  expect(res3headers[NEXTJS_CACHE_HEADER]).toBe("HIT");
  expect(newFirstMarket["marketID"]).toBe(secondMarket["marketID"]);
  expect(newSecondMarket["marketID"]).toBe(firstMarket["marketID"]);
  expect(newFirstMarket["bumpTime"]).toBeGreaterThanOrEqual(newSecondMarket["bumpTime"])
});
