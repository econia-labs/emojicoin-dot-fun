/* eslint-disable no-underscore-dangle */
import { DockerTestHarness } from "./utils/docker/docker-test-harness";

export default async function teardown() {
  await DockerTestHarness.stop();
}
