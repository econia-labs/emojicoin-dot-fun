/* eslint-disable no-underscore-dangle */
import { DockerTestHarness } from "../../../sdk/tests/utils/docker/docker-test-harness";

// Requires that the frontend already be running on the host machine.
export default async function postTest() {
  await DockerTestHarness.stop();
}
