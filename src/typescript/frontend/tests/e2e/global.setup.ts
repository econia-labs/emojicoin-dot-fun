import { test as setup } from "@playwright/test";
import {
  Frontend,
  Inbox,
  LocalNode,
  PK_PATH,
  PUBLISH_RES_PATH,
  getPublisherPKForTest,
  publishForTest,
} from "@econia-labs/emojicoin-test-utils";
import fs from "fs";
import path from "path";

setup("start stack", async () => {
  setup.slow();

  const localNode = new LocalNode();
  globalThis.__LOCAL_NODE__ = localNode;
  await localNode.run();

  // This is not done in parallel as Inbox requires the local node to be up first.
  const inbox = new Inbox();
  await inbox.run();

  const frontend = new Frontend();
  globalThis.__FRONTEND__ = frontend;
  await frontend.run();

  fs.mkdirSync(path.dirname(PK_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(PUBLISH_RES_PATH), { recursive: true });

  const pk = await getPublisherPKForTest();
  if (!pk) {
    throw new Error("Please provide a private key for testing");
  }
  fs.writeFileSync(PK_PATH, pk);
  const publishResult = JSON.stringify(await publishForTest(pk), null, 2);
  fs.writeFileSync(PUBLISH_RES_PATH, publishResult);
});
