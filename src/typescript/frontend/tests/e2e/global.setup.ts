import { test as setup } from '@playwright/test';
import { DockerTestHarness } from "../../../sdk/src/utils/test/docker/docker-test-harness";

setup('setup', async ({ }) => {
  setup.setTimeout(240000);
  const startDockerServices = process.env.APTOS_NETWORK === "local";
  if (startDockerServices) {
    // Print an empty line to separate `Determining test suites to run...` from the logs.
    console.debug();
    // --------------------------------------------------------------------------------------
    //                             Start the docker containers.
    // --------------------------------------------------------------------------------------
    await DockerTestHarness.run(true);

    // The docker container start-up script publishes the package on-chain.
  }
});
