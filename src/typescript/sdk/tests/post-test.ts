/* eslint-disable no-underscore-dangle */
import { type DockerTestHarness } from "./utils/docker/docker-test-harness";

export default async function postTest() {
  // @ts-ignore
  const testHarness: DockerTestHarness = globalThis.__TEST_HARNESS__;
  await testHarness.stop();
}
