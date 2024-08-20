import { Frontend, Inbox, LocalNode } from "@econia-labs/emojicoin-test-utils";
import { test as teardown } from "@playwright/test";

teardown("stop stack", async () => {
  teardown.slow();

  if (process.env.START_LOCAL_NODE_FOR_TEST == "true") {
    await LocalNode.stop();
    await Frontend.stop();
    await Inbox.stop();
    await Inbox.clearState();
  }
});
