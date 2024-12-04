// eslint-disable no-await-in-loop
// cspell:word localnet

import path from "node:path";
import os from "node:os";
import { kill } from "node:process";
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
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const LOCAL_COMPOSE_PATH = path.join(getGitRoot(), "src/docker", "compose.local.yaml");
const LOCAL_ENV_PATH = path.join(getGitRoot(), "src/docker", "example.local.env");
const PRUNE_SCRIPT = path.join(getGitRoot(), "src/docker/utils", "prune.sh");

const PING_STATE_INTERVAL = 200;
const MAX_WAIT_TIME_SECONDS = 600;
const TMP_PID_FILE_PATH = path.join(os.tmpdir(), "emojicoin-e2e-process-id");

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

export class DockerTestHarness {
  constructor() {}

  /**
   * Removes all related processes.
   */
  static remove() {
    return execPromise(`bash ${PRUNE_SCRIPT} --reset-localnet --yes`);
  }

  /**
   * Stops the Docker containers.
   */
  static async stop({ frontend }: { frontend: boolean }) {
    await execPromise(
      `docker compose -f ${LOCAL_COMPOSE_PATH} ${frontend ? "--profile frontend" : ""} --env-file ${LOCAL_ENV_PATH} stop`
    );
    const process = Number(readFileSync(TMP_PID_FILE_PATH, { encoding: "utf-8" }));
    if (process) {
      kill(process);
    }
  }

  /**
   * Calls the Docker helper script to start the containers.
   */
  static async run({
    frontend,
    filterLogsFrom = [],
  }: {
    frontend: boolean;
    filterLogsFrom?: ContainerName[];
  }) {
    await DockerTestHarness.start({ frontend, filterLogsFrom });
    const promises = [
      DockerTestHarness.waitForPrimaryService(frontend),
      DockerTestHarness.waitForDeployer(),
      DockerTestHarness.waitForMigrationsToComplete(),
    ];
    await Promise.all(promises);
  }

  /**
   * Starts a completely new Docker environment for the test harness.
   */
  static async start({
    frontend,
    filterLogsFrom,
  }: {
    frontend: boolean;
    filterLogsFrom: ContainerName[];
  }) {
    // Ensure that we have a fresh Docker environment before starting the test harness.
    await DockerTestHarness.remove();

    const command = "docker";

    // Always build the frontend container if we're using it.
    if (frontend) {
      execSync(
        `docker compose -f ${LOCAL_COMPOSE_PATH} --env-file ${LOCAL_ENV_PATH} build frontend`,
        { stdio: "inherit" }
      );
    }

    const args = [
      "compose",
      "-f",
      LOCAL_COMPOSE_PATH,
      "--env-file",
      LOCAL_ENV_PATH,
      ...(frontend ? ["--profile", "frontend"] : []),
      "up",
    ].filter((arg) => arg !== "");

    const process = spawnWrapper(command, args, false, filterLogsFrom);
    writeFileSync(TMP_PID_FILE_PATH, process.pid?.toString() ?? "");
  }

  /**
   * Waits for the @see DockerTestHarness instance's docker container to be up.
   *
   * @returns Promise<boolean>
   */
  static async waitForPrimaryService(frontend: boolean): Promise<boolean> {
    // The broker will be the last container up, unless we're running the frontend.
    // In that case, the frontend will be last.
    const container: ContainerName = frontend ? "frontend" : "broker";
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
