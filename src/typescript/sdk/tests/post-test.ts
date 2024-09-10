import { DockerTestHarness } from "./utils/docker-test-harness";
import { printDivider } from "./utils/print-divider";

export default async function postTest() {
  await DockerTestHarness.stop();
}
