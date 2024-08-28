// eslint-disable no-await-in-loop

import { spawn } from "child_process";
import path from "path";
import { sleep } from "../../src/utils";
import { getGitRoot } from "./helpers";

const CONTAINERS_AND_HEALTHCHECK_ENDPOINTS = {
  "local-testnet": "http://localhost:8070/",
  processor: "http://localhost:8084/metrics/",
  // Note that we start the broker regardless, we just don't wait for it unless
  // it's specified to be run in the constructor.
  "processor-and-broker": `http://localhost:${process.env.BROKER_PORT}/`,
  "processor-and-broker-and-frontend": "http://localhost:3001/",
};

const TEST_RUNNER_PATH = path.join(getGitRoot(), "src/sh/emojicoin/test-runner.sh");
const MAXIMUM_WAIT_TIME_SEC = 120;
export class DockerDirector {
  public waitTimeSeconds: number;

  public container: keyof typeof CONTAINERS_AND_HEALTHCHECK_ENDPOINTS;

  public healthCheckEndpoint: string;

  public resetContainersOnStart: boolean;

  public pullImages: boolean;

  public buildImages: boolean;

  constructor(args: {
    container: keyof typeof CONTAINERS_AND_HEALTHCHECK_ENDPOINTS;
    resetContainersOnStart: boolean;
    pullImages: boolean;
    buildImages: boolean;
  }) {
    const { container, resetContainersOnStart, pullImages, buildImages } = args;
    this.container = container;
    this.healthCheckEndpoint = CONTAINERS_AND_HEALTHCHECK_ENDPOINTS[container];
    this.resetContainersOnStart = resetContainersOnStart;
    this.pullImages = pullImages;
    this.buildImages = buildImages;
    if (this.buildImages) {
      this.waitTimeSeconds = MAXIMUM_WAIT_TIME_SEC + 1200;
    } else {
      this.waitTimeSeconds = MAXIMUM_WAIT_TIME_SEC;
    }
  }

  /**
   * Removes all related processes.
   */
  static remove(): Promise<null> {
    const command = "bash";
    const args = [TEST_RUNNER_PATH, "--reset"];
    const childProcess = spawn(command, args);

    childProcess.stderr?.on("data", (data: any) => {
      console.warn(data.toString().trim());
    });

    childProcess.stdout?.on("data", (data: any) => {
      console.debug(data.toString().trim());
    });

    return new Promise((resolve) => {
      childProcess.on("close", () => {
        resolve(null);
      });
    });
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
    this.start();
    await this.waitUntilProcessIsUp();
  }

  /**
   * Starts the local testnet by running the aptos node run-local-testnet command.
   */
  start() {
    const command = "bash";
    const args = [
      TEST_RUNNER_PATH,
      "--start",
      this.pullImages ? "--pull" : "",
      this.buildImages ? "--build" : "",
      this.resetContainersOnStart ? "--reset" : "",
      this.container === "processor-and-broker-and-frontend" ? "" : "--no-frontend",
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
   * Waits for all processes to be up.
   *
   * @returns Promise<boolean>
   */
  async waitUntilProcessIsUp(): Promise<boolean> {
    // If we don't wait in between `start` and the readiness check, the readiness check
    // actually can unintentionally succeed if the containers existed from a previous run, because
    // the containers and volumes haven't been fully removed yet.
    // Then they are removed almost immediately after, resulting in an error where the containers/
    // resources aren't found or the connection socket is closed unexpectedly.
    // We need to wait at least a small amount of time up front if we're tearing down and
    // restarting the containers. Since the containers will never be started immediately,
    // we wait a larger amount of time than may be necessary to avoid an error.
    if (this.resetContainersOnStart || this.buildImages) {
      await sleep(5000);
    }

    let operational = await this.checkIfProcessIsUp();
    let secondsElapsed = 0;

    /* eslint-disable no-await-in-loop */
    while (!operational && secondsElapsed < this.waitTimeSeconds) {
      await sleep(1000);
      secondsElapsed += 1;
      operational = await this.checkIfProcessIsUp();
    }
    /* eslint-enable no-await-in-loop */

    // If we are here it means something blocked the process start-up.
    // Consider checking if another process is running on a conflicting port.
    if (!operational) {
      throw new Error("Process failed to start");
    }

    return true;
  }

  /**
   * Checks if the endpoint indicates readiness.
   *
   * @returns Promise<boolean>
   */
  async checkIfProcessIsUp(): Promise<boolean> {
    try {
      // Query readiness endpoint.
      const data = await fetch(this.healthCheckEndpoint);
      if (data.status === 200) {
        return true;
      }
      console.error(`Failed to check readiness at ${this.healthCheckEndpoint}`);
      return false;
    } catch (err: any) {
      return false;
    }
  }
}

export default DockerDirector;
