/* eslint-disable no-underscore-dangle */
import { type DockerTestHarness } from "./utils/docker/docker-test-harness";

export default async function postTest() {
  // @ts-expect-error Using `globalThis` as any.
  const testHarness: DockerTestHarness | undefined = globalThis.__TEST_HARNESS__;
  // if (testHarness) await testHarness.stop();
}
