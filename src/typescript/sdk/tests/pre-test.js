const { Account, Hex, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
const fs = require("fs");
const path = require("path");
const {
  Inbox,
  LocalNode,
  publishForTest,
  getTestPublisherPrivateKey,
  PUBLISHER_PRIVATE_KEY_PATH,
  PUBLISH_RES_PATH,
} = require("./utils");

module.exports = async function setup() {
  if (process.env.START_LOCAL_NODE_FOR_TEST === "true") {
    const localNode = new LocalNode();
    globalThis.__LOCAL_NODE__ = localNode;
    await localNode.run();

    // This is not done in parallel as Inbox requires the local node to be up first.
    const inbox = new Inbox();
    await inbox.run();
  }
  fs.mkdirSync(path.dirname(PUBLISHER_PRIVATE_KEY_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(PUBLISH_RES_PATH), { recursive: true });

  const privateKeyString = await getTestPublisherPrivateKey();
  if (!privateKeyString) {
    throw new Error("Please provide a private key for testing");
  }
  fs.writeFileSync(PUBLISHER_PRIVATE_KEY_PATH, privateKeyString);
  const publishResult = JSON.stringify(await publishForTest(privateKeyString), null, 2);
  fs.writeFileSync(PUBLISH_RES_PATH, publishResult);
};
