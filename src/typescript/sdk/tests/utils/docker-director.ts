// eslint-disable no-await-in-loop

import { spawn } from "child_process";
import { sleep } from "../../src/utils";
import { getGitRoot } from "./helpers";
import path from "path";

const CONTAINERS_AND_HEALTHCHECK_ENDPOINTS = {
  "local-testnet": "http://localhost:8070/",
  processor: "http://localhost:8084/metrics/",
  // Note that we start the broker regardless, we just don't wait for it unless
  // it's specified to be run in the constructor.
  "processor-and-broker": `http://localhost:${process.env.BROKER_PORT}/`,
  "processor-and-broker-and-frontend": `http://localhost:3001/`,
};

const TEST_RUNNER_PATH = path.join(getGitRoot(), "src/sh/emojicoin/test-runner.sh");

export class DockerDirector {
  readonly MAXIMUM_WAIT_TIME_SEC = 120;

  public container: keyof typeof CONTAINERS_AND_HEALTHCHECK_ENDPOINTS;

  public healthCheckEndpoint: string;

  public resetContainersOnStart: boolean;

  constructor(
    container: keyof typeof CONTAINERS_AND_HEALTHCHECK_ENDPOINTS,
    resetContainersOnStart: boolean
  ) {
    this.container = container;
    this.healthCheckEndpoint = CONTAINERS_AND_HEALTHCHECK_ENDPOINTS[container];
    this.resetContainersOnStart = resetContainersOnStart;
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
    return;
  }

  /**
   * Starts the local testnet by running the aptos node run-local-testnet command.
   */
  start() {
    const command = "bash";
    const args = [
      TEST_RUNNER_PATH,
      "--start",
      this.container === "processor-and-broker-and-frontend" ? "" : "--no-frontend",
      this.resetContainersOnStart ? "--reset" : "",
    ].filter((arg) => arg !== "");

    const childProcess = spawn(command, args);

    childProcess.stderr?.on("data", (data: any) => {
      console.warn(data.toString().trim());
    });

    childProcess.stdout?.on("data", (data: any) => {
      const s: string = "";
      console.debug(data.toString().trim());
    });
  }

  /**
   * Waits for all processes to be up.
   *
   * @returns Promise<boolean>
   */
  async waitUntilProcessIsUp(): Promise<boolean> {
    let operational = await this.checkIfProcessIsUp();
    let secondsElapsed = 0;

    while (!operational && secondsElapsed < this.MAXIMUM_WAIT_TIME_SEC) {
      const timeLeft = this.MAXIMUM_WAIT_TIME_SEC - secondsElapsed;
      await sleep(1000);
      secondsElapsed += 1;
      operational = await this.checkIfProcessIsUp();
    }

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