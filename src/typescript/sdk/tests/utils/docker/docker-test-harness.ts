// eslint-disable no-await-in-loop
// cspell:word localnet

import { ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { sleep } from "../../../src/utils";
import { getGitRoot } from "../helpers";
import { ContainerName } from "./logs";
import {
  getContainerState,
  isRunningAndHealthy,
  ContainerState,
  execPromise,
  spawnWrapper,
} from "./utils";

const LOCAL_COMPOSE_PATH = path.join(getGitRoot(), "src/docker", "compose.local.yaml");
const PRUNE_SCRIPT = path.join(getGitRoot(), "src/docker/utils", "prune.sh");

const PING_STATE_INTERVAL = 200;

async function isPrimaryContainerReady(name: ContainerName): Promise<boolean> {
  const state = await getContainerState(name);
  return isRunningAndHealthy(state);
}

const checkIfCorruptedData = (state?: ContainerState) => {
  // If the container isn't up yet, it can't be considered corrupted.
  if (!state || !state.Health.Log) {
    return;
  }

  // Check the logs to see if the container is indicating corrupted indexer data.
  const logs = state.Health.Log;
  if (!logs) {
    return;
  }
  logs
    .sort((a, b) => {
      const aStart = new Date(a.Start).getTime();
      const bStart = new Date(b.Start).getTime();
      return aStart - bStart;
    })
    .reverse();
  const latest = logs.at(0);
  if (
    latest &&
    latest.ExitCode !== 0 &&
    latest.Output.includes("The localnet indexer has stale data")
  ) {
    throw new Error("Localnet indexer has stale data.");
  }
};

const MAXIMUM_WAIT_TIME_SEC = 120;
function checkMaxWaitTime(container: ContainerName, secondsElapsed: number) {
  if (secondsElapsed >= MAXIMUM_WAIT_TIME_SEC) {
    throw new Error(`\`${container}\` is not running or healthy after maximum wait time.`);
  }
}

export class DockerTestHarness {
  public includeFrontend: boolean;

  public processes: ChildProcessWithoutNullStreams[] = [];

  constructor({ includeFrontend }: { includeFrontend: boolean }) {
    this.includeFrontend = includeFrontend;
  }

  /**
   * Removes all related processes.
   */
  static remove() {
    return execPromise(`bash ${PRUNE_SCRIPT} --reset-localnet --yes`);
  }

  /**
   * Stops the Docker containers.
   */
  async stop() {
    await execPromise(`docker compose -f ${LOCAL_COMPOSE_PATH} stop`);
    while (this.processes.length) {
      const process = this.processes.pop();
      if (process) {
        process.kill();
      }
    }
  }

  /**
   * Calls the Docker helper script to start the containers.
   */
  async run() {
    await this.start();
    const promises = [this.waitForPrimaryService(), this.waitForDeployer()];
    await Promise.all(promises);
  }

  /**
   * Starts a completely new Docker environment for the test harness.
   */
  async start() {
    // Ensure that we have a fresh Docker environment before starting the test harness.
    await DockerTestHarness.remove();

    const command = "docker";
    const args = [
      "compose",
      "-f",
      LOCAL_COMPOSE_PATH,
      "up",
      this.includeFrontend ? "--profile frontend" : "",
    ].filter((arg) => arg !== "");

    const child = spawnWrapper(command, args);
    this.processes.push(child);
  }

  /**
   * Waits for the specific docker container to be up.
   *
   * @returns Promise<boolean>
   */
  async waitForPrimaryService(): Promise<boolean> {
    let secondsElapsed = 0;
    // The broker will be the last container up, unless we're running the frontend.
    // In that case, the frontend will be last.
    const container: ContainerName = this.includeFrontend ? "frontend" : "broker";
    let ready: boolean = await isPrimaryContainerReady(container);

    while (!ready) {
      /* eslint-disable no-await-in-loop */
      await sleep(PING_STATE_INTERVAL);

      /* eslint-disable no-await-in-loop */
      ready = await isPrimaryContainerReady(container);

      checkMaxWaitTime(container, secondsElapsed);
      secondsElapsed += PING_STATE_INTERVAL / 1000;
    }
    return ready;
  }

  /**
   * Waits for the deployer to be up.
   */
  async waitForDeployer(): Promise<boolean> {
    const waitStartTime = new Date();
    let secondsElapsed = 0;
    const localnetName: ContainerName = "localnet";
    let localnet = await getContainerState(localnetName);
    while (!isRunningAndHealthy(localnet)) {
      checkIfCorruptedData(localnet);

      /* eslint-disable no-await-in-loop */
      await sleep(PING_STATE_INTERVAL);

      /* eslint-disable no-await-in-loop */
      localnet = await getContainerState(localnetName);
      checkMaxWaitTime(localnetName, secondsElapsed);
      secondsElapsed += PING_STATE_INTERVAL / 1000;
    }

    const ready = (state?: ContainerState) => {
      if (!state) {
        return false;
      }
      const {
        ExitCode: exitCode,
        Error: error,
        StartedAt: startedAt,
        FinishedAt: finishedAt,
      } = state;
      const wasStartedRecently = startedAt > waitStartTime;
      const finished = finishedAt > startedAt;
      return wasStartedRecently && exitCode === 0 && error === "" && finished;
    };

    // Then wait for the deployer to be up.
    const name: ContainerName = "deployer";
    let deployer = await getContainerState(name);
    while (!ready(deployer)) {
      /* eslint-disable no-await-in-loop */
      await sleep(PING_STATE_INTERVAL);

      /* eslint-disable no-await-in-loop */
      deployer = await getContainerState(name);
      checkMaxWaitTime(name, secondsElapsed);
      secondsElapsed += PING_STATE_INTERVAL / 1000;
    }
    return true;
  }
}
