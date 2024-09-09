import fs from "fs";
import path from "path";
import {
  getPublisherPKForTest,
  PK_PATH,
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
  const pk = getPublisherPKForTest();
  const publishTransaction = await getPublishTransactionFromIndexer(pk);

  fs.mkdirSync(path.dirname(PK_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(PUBLISH_RES_PATH), { recursive: true });
  fs.writeFileSync(PK_PATH, pk);

  const json = JSON.stringify(publishTransaction, null, 2);
  fs.writeFileSync(PUBLISH_RES_PATH, json);
}
