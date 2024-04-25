require("dotenv").config();
const { Account } = require("@aptos-labs/ts-sdk");
const fs = require("fs");
const path = require("path");
const {
  LocalNode,
  publishForTest,
  getGitRoot
} = require("./utils");

module.exports = async function setup() {
  if (process.env.START_LOCAL_NODE_FOR_TEST == "true") {
    const localNode = new LocalNode();
    globalThis.__LOCAL_NODE__ = localNode;
    await localNode.run();
  }
  const pkPath = path.resolve(path.join(getGitRoot(), ".tmp", ".pk"));
  const publishResPath = path.resolve(path.join(getGitRoot(), ".tmp", ".publish_result"));
  fs.mkdirSync(path.dirname(pkPath), { recursive: true });
  fs.mkdirSync(path.dirname(publishResPath), { recursive: true });

  const pk = Account.generate().privateKey.toString();
  fs.writeFileSync(pkPath, pk);
  const publishResult = JSON.stringify(await publishForTest(pk), null, 2);
  fs.writeFileSync(publishResPath, publishResult);
};
