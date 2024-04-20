const { LocalNode } = require("../src/cli");

module.exports = async function setup() {
  if (process.env.START_LOCAL_NODE == "true") {
    const localNode = new LocalNode();
    globalThis.__LOCAL_NODE__ = localNode;
    await localNode.run();
  }
};
