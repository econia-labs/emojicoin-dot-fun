/* eslint-disable no-underscore-dangle */
import WebSocket from "ws";
import { DockerTestHarness } from "../src/utils/test/docker/docker-test-harness";
import { type ContainerName } from "../src/utils/test/docker/logs";

export default async function preTest() {
  // @ts-expect-error Using `globalThis` as any for a polyfill for `WebSocket` in node.js.
  globalThis.WebSocket = WebSocket;

  const startDockerServices = process.env.NEXT_PUBLIC_APTOS_NETWORK === "local";
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
    // --------------------------------------------------------------------------------------
    //                             Start the docker containers.
    // --------------------------------------------------------------------------------------
    await DockerTestHarness.run(false);

    // The docker container start-up script publishes the package on-chain.
  }
}
