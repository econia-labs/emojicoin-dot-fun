import {
  getTestPublisherPrivateKey,
  PUBLISHER_PRIVATE_KEY_PATH,
  PUBLISH_RES_PATH,
} from "./utils";
import { DockerTestHarness } from "./utils/docker-test-harness";
import { getPublishTransactionFromIndexer } from "./utils/get-publish-txn-from-indexer";
import { ensureWriteFileSync } from "./utils/ensure-write-file-sync";

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
  ensureWriteFileSync(PUBLISHER_PRIVATE_KEY_PATH, privateKeyString);

  const publishTransaction = await getPublishTransactionFromIndexer(privateKeyString);
  const json = JSON.stringify(publishTransaction, null, 2);
  ensureWriteFileSync(PUBLISH_RES_PATH, json);
}
