/* eslint-disable @typescript-eslint/no-var-requires, import/no-commonjs */
const { DockerTestHarness } = require("./utils/docker/docker-test-harness");

module.exports = async function teardown() {
  // Jest might try to kill the container processes which are already stopped. Catch the ESRCH
  // error if so, but throw if it's a different error.
  try {
    await DockerTestHarness.stop();
  } catch (e) {
    if (e.code !== "ESRCH") {
      throw e;
    }
  }
};
