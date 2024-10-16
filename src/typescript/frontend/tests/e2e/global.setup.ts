import { test as setup } from "@playwright/test";
import { DockerTestHarness } from "../../../sdk/src/utils/test/docker/docker-test-harness";

setup("setup the Docker containers", async ({}) => {
  // Five minute timeout.
  setup.setTimeout(300_000);
  const startDockerServices = process.env.APTOS_NETWORK === "local";
  if (startDockerServices) {
    await DockerTestHarness.run(true);
  }
});
