// eslint-disable no-await-in-loop
// cspell:word localnet

import { exec, spawn } from "child_process";
import path from "path";
import { promisify } from "node:util";
import { sleep } from "../../src/utils";
import { getGitRoot } from "./helpers";

const execPromise = promisify(exec);

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

async function getDockerContainerStatus(name: ContainerName): Promise<ContainerStatus> {
  try {
    const { stdout } = await execPromise(
      `docker inspect -f '{{.State.Running}},{{.State.Health.Status}}' ${name}`
    );
    const [running, health] = stdout.trim().split(",");
    return {
      isRunning: running === "true",
      isHealthy: health === "healthy",
    };
  } catch (error) {
    // If the container doesn't exist or there's another error, we return false for both.
    return { isRunning: false, isHealthy: false };
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
   * Calls the Docker helper script to start the containers.
   */
  async run() {
    await DockerTestHarness.remove();
    await this.start();
    await this.waitForContainer();
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

    const childProcess = spawn(command, args);

    childProcess.stderr?.on("data", (data: any) => {
      console.warn(data.toString().trim());
    });

    childProcess.stdout?.on("data", (data: any) => {
      console.debug(data.toString().trim());
    });
  }

  /**
   * Waits for the specific docker container to be up.
   *
   * @returns Promise<boolean>
   */
  async waitForContainer(): Promise<boolean> {
    let secondsElapsed = 0;
    // The broker will be the last container up, unless we're running the frontend.
    // In that case, the frontend will be last.
    const container: ContainerName = this.includeFrontend ? "frontend" : "broker";
    let status: ContainerStatus = await getDockerContainerStatus(container);

    while (!status.isHealthy && !status.isRunning) {
      /* eslint-disable no-await-in-loop */
      await sleep(1000);

      /* eslint-disable no-await-in-loop */
      status = await getDockerContainerStatus(container);

      if (secondsElapsed >= MAXIMUM_WAIT_TIME_SEC) {
        throw new Error("Container is not running or healthy after maximum wait time.");
      }

      secondsElapsed += 1;
    }
    return status.isHealthy && status.isRunning;
  }
}
