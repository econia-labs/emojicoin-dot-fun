import { REMOVE_CONTAINERS_ON_EXIT } from "./utils/helpers";
import { DockerTestHarness } from "./utils/docker-test-harness";

export default async function postTest() {
  if (REMOVE_CONTAINERS_ON_EXIT) {
    await DockerTestHarness.remove();
  }
}
