const fs = require("fs");
const path = require("path");
const {
  publishPackagesForTest,
  getPublisherPKForTest,
  PK_PATH,
  PUBLISH_RES_PATH,
  RESET_CONTAINERS_ON_START,
  PUBLISH_PACKAGES_FOR_TEST,
} = require("./utils");
const DockerDirector = require("./utils/docker-director.ts").default;

module.exports = async function setup() {
  console.log();
  console.log("Setting up test environment...");

  // --------------------------------------------------------------------------------------
  //                              Start the docker containers.
  // --------------------------------------------------------------------------------------
  const director = new DockerDirector(
    "processor-and-broker",
    RESET_CONTAINERS_ON_START,
    PUBLISH_PACKAGES_FOR_TEST,
  );
  await director.run();

  // Note that the docker container start-up script publishes the package on-chain.
  // --------------------------------------------------------------------------------------
  //                         Find the publish transaction on-chain.
  // --------------------------------------------------------------------------------------
  const pk = getPublisherPKForTest();

  fs.mkdirSync(path.dirname(PK_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(PUBLISH_RES_PATH), { recursive: true });

  fs.writeFileSync(PK_PATH, pk);
  const publishResult = await publishPackagesForTest(pk);
  const json = JSON.stringify(publishResult, null, 2);
  fs.writeFileSync(PUBLISH_RES_PATH, json);
};
