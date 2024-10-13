// eslint-disable no-await-in-loop
// cspell:word localnet

import { type ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { waitFor } from "../../../src/utils";
import { getGitRoot } from "../helpers";
import { type ContainerName } from "./logs";
import {
  getContainerState,
  isRunningAndHealthy,
  type ContainerState,
  execPromise,
  spawnWrapper,
} from "./utils";
import { EMOJICOIN_INDEXER_URL } from "../../../src/server/env";
import { TableName } from "../../../src/indexer-v2/types/json-types";

const LOCAL_COMPOSE_PATH = path.join(getGitRoot(), "src/docker", "compose.local.yaml");
const PRUNE_SCRIPT = path.join(getGitRoot(), "src/docker/utils", "prune.sh");

const PING_STATE_INTERVAL = 200;

async function isPrimaryContainerReady(name: ContainerName): Promise<boolean> {
  const state = await getContainerState(name);
  return isRunningAndHealthy(state);
}

const isDataNotCorrupted = (state?: ContainerState): boolean | undefined => {
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
  return true;
};

const MAX_WAIT_TIME_SECONDS = 120;

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
    const promises = [
      this.waitForPrimaryService(),
      DockerTestHarness.waitForDeployer(),
      DockerTestHarness.waitForMigrationsToComplete(),
    ];
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
   * Waits for the @see DockerTestHarness instance's docker container to be up.
   *
   * @returns Promise<boolean>
   */
  async waitForPrimaryService(): Promise<boolean> {
    // The broker will be the last container up, unless we're running the frontend.
    // In that case, the frontend will be last.
    const container: ContainerName = this.includeFrontend ? "frontend" : "broker";
    const ready = await waitFor({
      condition: async () => await isPrimaryContainerReady(container),
      interval: PING_STATE_INTERVAL,
      maxWaitTime: MAX_WAIT_TIME_SECONDS * 1000,
      errorMessage: `\`${container}\` is not healthy after ${MAX_WAIT_TIME_SECONDS} seconds.`,
    });
    return ready;
  }

  static async waitForDeployer(): Promise<boolean> {
    const waitStartTime = new Date();

    const isLocalnetReady = async () => {
      const state = await getContainerState("localnet");
      const notCorrupted = isDataNotCorrupted(state);
      const healthy = isRunningAndHealthy(state);
      return healthy && notCorrupted === true;
    };

    const isDeployerReady = async () => {
      const state = await getContainerState("deployer");
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

    const localnetReady = await waitFor({
      condition: isLocalnetReady,
      interval: PING_STATE_INTERVAL,
      maxWaitTime: MAX_WAIT_TIME_SECONDS * 1000,
      errorMessage: `localnet is not healthy after ${MAX_WAIT_TIME_SECONDS} seconds.`,
    });

    const deployerReady = await waitFor({
      condition: isDeployerReady,
      interval: PING_STATE_INTERVAL,
      maxWaitTime: MAX_WAIT_TIME_SECONDS * 1000,
      errorMessage: `deployer is not healthy after ${MAX_WAIT_TIME_SECONDS} seconds.`,
    });

    return localnetReady && deployerReady;
  }

  static async waitForMigrationsToComplete(): Promise<boolean> {
    // Because `pre-test.ts` imports this file, and we have `server-only` for queries, we must
    // write the query here to avoid getting an error. `--react-conditions=server-only` does not
    // fix the issue, because it seems that `pre-test.ts` does not run with those conditions.
    const getLatestVersion = async () => {
      const url = new URL(TableName.ProcessorStatus, EMOJICOIN_INDEXER_URL);
      url.searchParams.set("select", "last_success_version");
      url.searchParams.set("limit", "1");
      return await fetch(url)
        .then((res) => res.json())
        .then((data: [{ last_success_version: string }]) => data)
        .then((data) => data.pop()?.last_success_version)
        .then((version) => (version ? BigInt(version) : undefined));
    };

    const migrationsComplete = async () => {
      try {
        // Migrations are complete when the indexer has a row with last processed version == `0`.
        const latestVersion = await getLatestVersion();
        return typeof latestVersion === "bigint" && latestVersion >= 0n;
      } catch (e) {
        return false;
      }
    };

    return await waitFor({
      condition: migrationsComplete,
      interval: PING_STATE_INTERVAL,
      maxWaitTime: MAX_WAIT_TIME_SECONDS * 1000,
      errorMessage: `Processor didn't finish migrations after ${MAX_WAIT_TIME_SECONDS} seconds.`,
    });
  }
}
