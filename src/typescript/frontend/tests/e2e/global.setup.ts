import { test as setup } from "@playwright/test";
import { DockerTestHarness } from "../../../sdk/src/utils/test/docker/docker-test-harness";

setup("setup", async ({}) => {
  setup.setTimeout(240000);
  const startDockerServices = process.env.APTOS_NETWORK === "local";
  if (startDockerServices) {
    await DockerTestHarness.run(true);
  }
});
