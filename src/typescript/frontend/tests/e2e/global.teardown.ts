import { Frontend, Inbox, LocalNode } from '@econia-labs/emojicoin-test-utils';
import { test as teardown } from '@playwright/test';

teardown('stop stack', async ({ }) => {
  teardown.slow();
  console.log('stoping stack...');

  if (process.env.START_LOCAL_NODE_FOR_TEST == "true") {
    const aptosNode = new LocalNode();
    aptosNode.stop();
    const frontend = new Frontend();
    frontend.stop();

    await Inbox.stop();
    await Inbox.clearState();
  }
});
