/* eslint-disable no-underscore-dangle */
import { DockerTestHarness } from "../src/utils/test/docker/docker-test-harness";

export default async function postTest() {
  await DockerTestHarness.stop();
}
