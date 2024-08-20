let { Inbox, LocalNode } = require("@econia-labs/emojicoin-test-utils");

module.exports = async function () {
  // Check if the current local node process is
  // from within this node testing environment
  if (process.env.START_LOCAL_NODE_FOR_TEST == "true" && globalThis.__LOCAL_NODE__.process) {
    // Local node runs multiple processes, to avoid asynchronous operations
    // that weren't stopped in our tests, we kill all the descendent processes
    // of the node process, including the node process itself
    await LocalNode.stop();

    await Inbox.stop();
    await Inbox.clearState();
  }
};
