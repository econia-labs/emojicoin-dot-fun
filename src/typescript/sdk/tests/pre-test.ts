/* eslint-disable no-underscore-dangle */
import WebSocket from "ws";
import { DockerTestHarness } from "./utils/docker/docker-test-harness";

// If you'd like to see the processor, broker, and postgres logs while the tests are running,
// set `process.env.SHOW_TEST_LOGS_IN_DEVELOPMENT="true"` before/while running the tests.

// Please note that prior to the tests, the `deployer` Docker service registers two markets, ["💧"],
// and ["🔥"], to ensure that it's possible to publish the emojicoin arena module.
// Without these two, the `init_module` function will loop infinitely and time out.
// You can find the relevant publication code in `deployer/sh`.
export default async function preTest() {
  // @ts-expect-error Using `globalThis` as any for a polyfill for `WebSocket` in node.js.
  globalThis.WebSocket = WebSocket;

  const startDockerServices = process.env.NEXT_PUBLIC_APTOS_NETWORK === "local";
  const setupTest = !process.env.NO_TEST_SETUP;
  if (setupTest && startDockerServices) {
    // Print an empty line to separate `Determining test suites to run...` from the logs.
    console.debug();
    // --------------------------------------------------------------------------------------
    //                             Start the docker containers.
    // --------------------------------------------------------------------------------------
    const CI = !!process.env.CI;
    const showTestLogsInDevelopment = process.env.SHOW_TEST_LOGS_IN_DEVELOPMENT === "true";

    // Start the Docker test harness.
    await DockerTestHarness.run({
      filterLogsFrom: CI
        ? []
        : showTestLogsInDevelopment
          ? []
          : // By default, filter most logs in local development. They make it difficult to see
            // jest errors and warnings.
            ["broker", "processor", "postgres"],
    });
  }
}
