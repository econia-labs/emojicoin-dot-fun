/* eslint-disable @typescript-eslint/no-var-requires, import/no-commonjs */
const { DockerTestHarness } = require("./utils/docker/docker-test-harness");

module.exports = async function teardown() {
  await DockerTestHarness.stop();
};
