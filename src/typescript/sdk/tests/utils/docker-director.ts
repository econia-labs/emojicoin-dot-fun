// eslint-disable no-await-in-loop

import { exec, spawn } from "child_process";
import path from "path";
import { promisify } from "node:util";
import { sleep } from "../../src/utils";
import { getGitRoot } from "./helpers";

const execPromise = promisify(exec);

type ContainerName =
  | "local-testnet-indexer-api"
  | "local-testnet-postgres"
  | "docker-aptos-node-1"
  | "docker-broker-1"
  | "docker-frontend-1"
  | "docker-processor-1"
  | "docker-postgres-1"
  | "docker-postgrest-1";

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

const TEST_RUNNER_PATH = path.join(getGitRoot(), "src/sh/emojicoin/test-runner.sh");
const MAXIMUM_WAIT_TIME_SEC = 120;
export class DockerDirector {
  public container: ContainerName;

  public removeContainersOnStart: boolean;

  public publishType: "json" | "compile";

  public skipJSONCompilation: boolean;

  constructor(args: {
    container: ContainerName;
    removeContainersOnStart: boolean;
    skipJSONCompilation?: boolean;
    publishType?: "json" | "compile";
  }) {
    const { container, removeContainersOnStart, publishType, skipJSONCompilation } = args;
    this.container = container;
    this.removeContainersOnStart = removeContainersOnStart;
    this.publishType = publishType || "compile";

    if (skipJSONCompilation && publishType !== "json") {
      throw new Error("You can only skip compilation if if publishType is set to `--json`");
    }
    this.skipJSONCompilation = skipJSONCompilation || false;
  }

  /**
   * Removes all related processes.
   */
  static remove() {
    return execPromise(`bash ${TEST_RUNNER_PATH} --remove`);
  }

  /**
   * Runs a local testnet, processor/publisher, broker, and possibly frontend app.
   *
   * Waits for all processes to be up. Note that the frontend app is optional.
   *
   * The order is `local testnet => processor/publisher => broker => frontend app`.
   *
   * If any of the processes are already up, this returns and does not start any new processes.
   */
  async run() {
    await this.start();
    await this.waitUntilProcessIsUp();
  }

  /**
   * Starts the local testnet by running the aptos node run-local-testnet command.
   */
  async start() {
    if (this.removeContainersOnStart) {
      console.debug();
      const { stdout, stderr } = await DockerDirector.remove();
      console.debug(stdout);
      console.debug(stderr);
    }

    const command = "bash";
    const args = [
      TEST_RUNNER_PATH,
      "--start",
      this.container === "docker-frontend-1" ? "" : "--no-frontend",
      this.publishType === "json" ? "--json" : "--compile",
      this.skipJSONCompilation ? "--no-compile" : "",
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
  async waitUntilProcessIsUp(): Promise<boolean> {
    let secondsElapsed = 0;
    let status: ContainerStatus = await getDockerContainerStatus(this.container);

    while (!status.isHealthy && !status.isRunning) {
      /* eslint-disable no-await-in-loop */
      await sleep(1000);

      /* eslint-disable no-await-in-loop */
      status = await getDockerContainerStatus(this.container);

      if (secondsElapsed >= MAXIMUM_WAIT_TIME_SEC) {
        throw new Error("Container is not running or healthy after maximum wait time.");
      }

      secondsElapsed += 1;
    }
    return status.isHealthy && status.isRunning;
  }
}
