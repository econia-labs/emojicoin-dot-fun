/* eslint-disable no-underscore-dangle */
import WebSocket from "ws";
import { DockerTestHarness } from "../src/utils/test/docker/docker-test-harness";

// process.env.NO_TEST_SETUP => to skip the docker container test setup, like for unit tests.
// process.env.FILTER_TEST_LOGS => quiet mode, don't output logs that print to the console a lot.

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
    // Start the Docker test harness without the frontend container.
    await DockerTestHarness.run({
      frontend: false,
      filterLogsFrom:
        process.env.FILTER_TEST_LOGS === "true"
          ? ["broker", "processor", "frontend", "postgres"]
          : [],
    });
  }
}
