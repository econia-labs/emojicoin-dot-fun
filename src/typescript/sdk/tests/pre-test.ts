import fs from "fs";
import path from "path";
import {
  getPublisherPKForTest,
  PK_PATH,
  PUBLISH_RES_PATH,
  RESET_CONTAINERS_ON_START,
} from "./utils";
import { DockerDirector } from "./utils/docker-director";
import { getPublishTransactionFromIndexer } from "./utils/get-publish-txn-from-indexer";

export default async function preTest() {
  const globalThisAny = globalThis as any;
  /* eslint-disable-next-line */
  globalThisAny.__GLOBAL_DIRECTOR__ = new DockerDirector({
    container: "docker-broker-1",
    removeContainersOnStart: RESET_CONTAINERS_ON_START,
    // `json` is better if you're frequently changing the code, `compile` is better if you
    // don't mind an initial long wait time. Sometimes there are issues with cloning from git
    // and `json` is better in those cases.
    publishType: "json",
  });
  // --------------------------------------------------------------------------------------
  //                             Start the docker containers.
  // --------------------------------------------------------------------------------------
  /* eslint-disable-next-line */
  await globalThisAny.__GLOBAL_DIRECTOR__.run();

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
