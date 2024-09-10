// eslint-disable no-await-in-loop
// cspell:word localnet

import { exec, ExecException, ExecOptions, spawn } from "child_process";
import path from "path";
import { promisify } from "node:util";
import { sleep } from "../../src/utils";
import { getGitRoot } from "./helpers";

type ExecCallback = (
  error: ExecException | null,
  stdout: string | Buffer,
  stderr: string | Buffer
) => void;

const logger: ExecCallback = (error, stdout, stderr) => {
  console.log(stdout);
  console.warn(stderr);
  if (error) {
    console.error(error);
  }
};

const execPromise = async (cmd: string, quiet: boolean = false) => {
  const res = promisify(exec);
  return res(cmd).then((result) => {
    if (process.env.VERBOSE && !quiet) {
      logger(null, result.stdout, result.stderr);
    }
    return result;
  });
};

type ContainerName =
  | "local-testnet-indexer-api"
  | "local-testnet-postgres"
  | "broker"
  | "deployer"
  | "frontend"
  | "localnet"
  | "processor"
  | "postgres"
  | "postgrest";

const LOCAL_COMPOSE_PATH = path.join(getGitRoot(), "src/docker", "compose.local.yaml");
const PRUNE_SCRIPT = path.join(getGitRoot(), "src/docker/utils", "prune.sh");

interface ContainerStatus {
  isRunning: boolean;
  isHealthy: boolean;
}

type ContainerStateJSON = {
  Status: string;
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid: number;
  ExitCode: number;
  Error: string;
  StartedAt: string; // ISO-8601 string.
  FinishedAt: string; // ISO-8601 string.
  Health: {
    Status: "healthy" | "unhealthy" | "starting" | "none";
    FailingStreak: number;
  };
};

type ContainerState = Omit<ContainerStateJSON, "StartedAt" | "FinishedAt"> & {
  StartedAt: Date;
  FinishedAt: Date;
};

const PING_STATE_INTERVAL = 200;

async function getContainerState(name: ContainerName): Promise<ContainerState> {
  const { stdout } = await execPromise(`docker inspect --format '{{json .State}}' ${name}`, true);
  const state: ContainerStateJSON = JSON.parse(stdout.trim());
  return {
    ...state,
    StartedAt: new Date(state.StartedAt),
    FinishedAt: new Date(state.FinishedAt),
  };
}

async function getPrimaryContainerStatus(name: ContainerName): Promise<ContainerStatus> {
  try {
    const state = await getContainerState(name);
    return {
      isRunning: state.Running,
      isHealthy: state.Health.Status === "healthy",
    };
  } catch (error) {
    // If the container doesn't exist or there's another error, we return false for both.
    return { isRunning: false, isHealthy: false };
  }
}

function checkMaxWaitTime(secondsElapsed: number) {
  if (secondsElapsed >= MAXIMUM_WAIT_TIME_SEC) {
    throw new Error("Container is not running or healthy after maximum wait time.");
  }
}

const MAXIMUM_WAIT_TIME_SEC = 120;
export class DockerTestHarness {
  public includeFrontend: boolean;

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
  static async stop() {
    const res = await execPromise(`docker compose -f ${LOCAL_COMPOSE_PATH} stop`);
    console.log(res);
    console.log("Docker containers stopped.");
  }

  /**
   * Calls the Docker helper script to start the containers.
   */
  async run() {
    await DockerTestHarness.remove();
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

    spawn(command, args);
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
    let status: ContainerStatus = await getPrimaryContainerStatus(container);

    while (!status.isHealthy && !status.isRunning) {
      /* eslint-disable no-await-in-loop */
      await sleep(PING_STATE_INTERVAL);

      /* eslint-disable no-await-in-loop */
      status = await getPrimaryContainerStatus(container);

      checkMaxWaitTime(secondsElapsed);
      secondsElapsed += PING_STATE_INTERVAL / 1000;
    }
    return status.isHealthy && status.isRunning;
  }

  /**
   * Waits for the deployer to be up.
   */
  async waitForDeployer(): Promise<boolean> {
    const waitStartTime = new Date();
    let secondsElapsed = 0;
    let localnetStatus = await getPrimaryContainerStatus("localnet");
    while (!(localnetStatus.isHealthy && localnetStatus.isRunning)) {
      /* eslint-disable no-await-in-loop */
      await sleep(PING_STATE_INTERVAL);

      /* eslint-disable no-await-in-loop */
      localnetStatus = await getPrimaryContainerStatus("localnet");
      checkMaxWaitTime(secondsElapsed);
      secondsElapsed += PING_STATE_INTERVAL / 1000;
    }

    const ready = (state: ContainerState) => {
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
    let state = await getContainerState("deployer");
    while (!ready(state)) {
      /* eslint-disable no-await-in-loop */
      await sleep(PING_STATE_INTERVAL);

      /* eslint-disable no-await-in-loop */
      state = await getContainerState("deployer");
      checkMaxWaitTime(secondsElapsed);
      secondsElapsed += PING_STATE_INTERVAL / 1000;
    }
    return true;
  }
}
