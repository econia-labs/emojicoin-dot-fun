/* eslint-disable no-underscore-dangle */

export default async function postTest() {
  // @ts-ignore
  const testHarness: DockerTestHarness | undefined = globalThis.__TEST_HARNESS__;
  if (testHarness) await testHarness.stop();
}
