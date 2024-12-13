/* eslint-disable no-underscore-dangle */
import { DockerTestHarness } from "../../../sdk/tests/utils/docker/docker-test-harness";

export default async function postTest() {
  await DockerTestHarness.stop({ frontend: true });
}
