import { type ChildProcessWithoutNullStreams, spawn } from "child_process";
import { sleep } from "@econia-labs/emojicoin-common";
import findGitRoot from "find-git-root";

export class Inbox {
  // This is enough to start Inbox, but not to build it. It is recommended
  // to first build the docker images using `docker compose -f compose.yaml
  // build` manually.
  readonly MAXIMUM_WAIT_TIME_SEC = 750;

  // PostgREST URL.
  readonly READINESS_ENDPOINT = "http://127.0.0.1:3000/";

  process: ChildProcessWithoutNullStreams | null = null;

  /**
   * Stops the docker containers.
   *
   * Will not clear state.
   *
   * @returns Promise<null>
   */
  static stop(): Promise<null> {
    const cliCommand = "docker";
    const cliArgs = ["compose", "-p", "emojicoin-inbox-test", "down"];

    const childProcess = spawn(cliCommand, cliArgs);

    childProcess.stderr?.on("data", (data: any) => {
      const str = data.toString();
      // eslint-disable-next-line no-console
      console.log(str);
    });

    childProcess.stdout?.on("data", (data: any) => {
      const str = data.toString();
      // eslint-disable-next-line no-console
      console.log(str);
    });

    const p: Promise<null> = new Promise((r) => {
      childProcess.on("close", () => {
        r(null);
      });
    });

    return p;
  }

  /**
   * Runs Inbox inside docker containers.
   *
   * If Inbox is already up, it returns and does not start a new instance.
   */
  async run() {
    const nodeIsUp = await this.checkIfProcessIsUp();
    if (nodeIsUp) {
      return;
    }
    this.start();
    await this.waitUntilProcessIsUp();
  }

  /**
   * Starts Inbox inside docker containers.
   */
  start() {
    const cliCommand = "docker";
    const gitRoot = findGitRoot(process.cwd());
    const cliArgs = [
      "compose",
      "-p",
      "emojicoin-inbox-test",
      "-f",
      `${gitRoot}/../src/inbox/compose.yaml`,
      "--env-file",
      `${gitRoot}/../src/typescript/frontend/.inbox.env.ci`,
      "up",
      "-d",
    ];

    const childProcess = spawn(cliCommand, cliArgs);
    this.process = childProcess;

    childProcess.stderr?.on("data", (data: any) => {
      const str = data.toString();
      // eslint-disable-next-line no-console
      console.log(str);
    });

    childProcess.stdout?.on("data", (data: any) => {
      const str = data.toString();
      // eslint-disable-next-line no-console
      console.log(str);
    });
  }

  /**
   * Waits for Inbox to be up.
   *
   * @returns Promise<boolean>
   */
  async waitUntilProcessIsUp(): Promise<boolean> {
    let operational = await this.checkIfProcessIsUp();
    const start = Date.now() / 1000;
    let last = start;

    while (!operational && start + this.MAXIMUM_WAIT_TIME_SEC > last) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
      // eslint-disable-next-line no-await-in-loop
      operational = await this.checkIfProcessIsUp();
      last = Date.now() / 1000;
    }

    if (!operational) {
      throw new Error("Process failed to start");
    }

    return true;
  }

  /**
   * Checks if Inbox is up.
   *
   * @returns Promise<boolean>
   */
  async checkIfProcessIsUp(): Promise<boolean> {
    try {
      // Query readiness endpoint
      const data = await fetch(this.READINESS_ENDPOINT);
      if (data.status === 200) {
        return true;
      }
      return false;
    } catch (err: any) {
      return false;
    }
  }

  /**
   * Clears the state (database docker volume) of Inbox.
   *
   * @returns Promise<null>
   */
  static async clearState(): Promise<null> {
    const cliCommand = "docker";
    const cliArgs = ["volume", "rm", "emojicoin-inbox-test_db"];

    const childProcess = spawn(cliCommand, cliArgs);

    childProcess.stderr?.on("data", (data: any) => {
      const str = data.toString();
      // eslint-disable-next-line no-console
      console.log(str);
    });

    childProcess.stdout?.on("data", (data: any) => {
      const str = data.toString();
      // eslint-disable-next-line no-console
      console.log(str);
    });

    const p: Promise<null> = new Promise((r) => {
      childProcess.on("close", () => {
        r(null);
      });
    });

    return p;
  }
}
