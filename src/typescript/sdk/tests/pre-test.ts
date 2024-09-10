import { getTestPublisherPrivateKey, PUBLISHER_PRIVATE_KEY_PATH, PUBLISH_RES_PATH } from "./utils";
import { DockerTestHarness } from "./utils/docker/docker-test-harness";
import { getPublishTransactionFromIndexer } from "./utils/get-publish-txn-from-indexer";
import { ensureWriteFileSync } from "./utils/ensure-write-file-sync";
import { ContainerName } from "./utils/docker/logs";

export default async function preTest() {
  // Print an empty line to separate `Determining test suites to run...` from the logs.
  console.debug();
  const logsFilter: Array<ContainerName> = [];
  // Only show more meaningful test logs by default.
  if (!process.env.VERBOSE) {
    logsFilter.push(...(["broker", "processor", "frontend", "postgres"] as Array<ContainerName>));
  }
  // @ts-ignore
  globalThis.__DOCKER_LOGS_FILTER__ = logsFilter;
  const testHarness = new DockerTestHarness({ includeFrontend: false });
  // --------------------------------------------------------------------------------------
  //                             Start the docker containers.
  // --------------------------------------------------------------------------------------
  await testHarness.run();
  // @ts-ignore
  globalThis.__TEST_HARNESS__ = testHarness;

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
