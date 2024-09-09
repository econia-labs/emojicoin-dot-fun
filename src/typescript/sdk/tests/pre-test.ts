import fs from "fs";
import path from "path";
import {
  getTestPublisherPrivateKey,
  PUBLISHER_PRIVATE_KEY_PATH,
  PUBLISH_RES_PATH,
} from "./utils";
import { DockerTestHarness } from "./utils/docker-test-harness";
import { getPublishTransactionFromIndexer } from "./utils/get-publish-txn-from-indexer";

export default async function preTest() {
  const testHarness = new DockerTestHarness({ includeFrontend: false });
  // --------------------------------------------------------------------------------------
  //                             Start the docker containers.
  // --------------------------------------------------------------------------------------
  await testHarness.run();

  // Note that the docker container start-up script publishes the package on-chain.
  // --------------------------------------------------------------------------------------
  //                        Find the publish transaction on-chain.
  // --------------------------------------------------------------------------------------
  const privateKeyString = getTestPublisherPrivateKey();
  const publishTransaction = await getPublishTransactionFromIndexer(privateKeyString);

  fs.mkdirSync(path.dirname(PUBLISHER_PRIVATE_KEY_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(PUBLISH_RES_PATH), { recursive: true });
  fs.writeFileSync(PUBLISHER_PRIVATE_KEY_PATH, privateKeyString);

  const json = JSON.stringify(publishTransaction, null, 2);
  fs.writeFileSync(PUBLISH_RES_PATH, json);
}
