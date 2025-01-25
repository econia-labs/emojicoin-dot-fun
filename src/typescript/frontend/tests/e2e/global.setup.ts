import { test as setup } from "@playwright/test";
import { DockerTestHarness } from "../../../sdk/tests/utils/docker/docker-test-harness";

setup("setup the Docker containers", async ({}) => {
  // Five minute timeout.
  setup.setTimeout(600_000);
  const startDockerServices = process.env.NEXT_PUBLIC_APTOS_NETWORK === "local";
  if (startDockerServices) {
    await DockerTestHarness.run({ frontend: true });
  }
});
