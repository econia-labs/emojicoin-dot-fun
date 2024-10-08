/* eslint-disable no-underscore-dangle */
import WebSocket from "ws";
import { DockerTestHarness } from "./utils/docker/docker-test-harness";
import { type ContainerName } from "./utils/docker/logs";

export default async function preTest() {
  // @ts-expect-error Using `globalThis` as any for a polyfill for `WebSocket` in node.js.
  globalThis.WebSocket = WebSocket;

  const startDockerServices = process.env.APTOS_NETWORK === "local";
  const setupTest = !process.env.NO_TEST_SETUP;
  if (setupTest && startDockerServices) {
    // Print an empty line to separate `Determining test suites to run...` from the logs.
    console.debug();
    const noLogs: Array<ContainerName> = [];
    // Only show more meaningful test logs by default.
    if (!process.env.VERBOSE_TEST_LOGS) {
      noLogs.push(...(["broker", "processor", "frontend", "postgres"] as Array<ContainerName>));
    }
    // @ts-expect-error Using `globalThis` as any.
    globalThis.__DOCKER_LOGS_FILTER__ = noLogs;
    const testHarness = new DockerTestHarness({ includeFrontend: false });
    // --------------------------------------------------------------------------------------
    //                             Start the docker containers.
    // --------------------------------------------------------------------------------------
    await testHarness.run();
    // @ts-expect-error Using `globalThis` as any.
    globalThis.__TEST_HARNESS__ = testHarness;

    // The docker container start-up script publishes the package on-chain.
  }
}
