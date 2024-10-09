import {
  type ChildProcessWithoutNullStreams,
  exec,
  type ExecException,
  spawn,
} from "child_process";
import { promisify } from "node:util";
import { type ContainerName, printLogs } from "./logs";

export interface ContainerStatus {
  isRunning: boolean;
  isHealthy: boolean;
}

export type ContainerStateJSON = {
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
    Log?: Array<{
      Start: string; // ISO-8601 string.
      End: string; // ISO-8601 string.
      ExitCode: number;
      Output: string;
    }>;
  };
};

export type ContainerState = Omit<ContainerStateJSON, "StartedAt" | "FinishedAt"> & {
  StartedAt: Date;
  FinishedAt: Date;
};

export const isRunningAndHealthy = (state?: ContainerState) =>
  state !== undefined && state.Running && state.Health.Status === "healthy";

type ExecCallback = (
  error: ExecException | null,
  stdout: string | Buffer,
  stderr: string | Buffer
) => void;

const logger: ExecCallback = (error, stdout, stderr) => {
  printLogs(stdout, []);
  printLogs(stderr, []);
  if (error) {
    console.error(error);
  }
};

export const execPromise = async (cmd: string, quiet: boolean = false) => {
  const res = promisify(exec);
  return res(cmd)
    .then((result) => {
      if (!quiet) {
        logger(null, result.stdout, result.stderr);
      }
      return result;
    })
    .catch((error) => {
      if (!error.message.includes("Command failed: docker inspect --format ")) {
        logger(error, error.stdout, error.stderr);
      }
      throw error;
    });
};

export async function getContainerState(name: ContainerName): Promise<ContainerState | undefined> {
  try {
    const { stdout } = await execPromise(`docker inspect --format '{{json .State}}' ${name}`, true);
    const state: ContainerStateJSON = JSON.parse(stdout.trim());
    const res = {
      ...state,
      StartedAt: new Date(state.StartedAt),
      FinishedAt: new Date(state.FinishedAt),
    };
    if (!res.Health.Log) {
      res.Health.Log = [];
    }
    return res;
  } catch (e) {
    return undefined;
  }
}

export const spawnWrapper = (
  command: string,
  args: string[],
  quiet: boolean = false,
  filterLogsFrom: ContainerName[] = [],
): ChildProcessWithoutNullStreams => {
  const childProcess = spawn(command, args);
  if (!quiet) {
    childProcess.stdout.on("data", (data) => {
      printLogs(data.toString().trim(), filterLogsFrom);
    });
    childProcess.stderr.on("data", (data) => {
      printLogs(data.toString().trim(), filterLogsFrom);
    });
    childProcess.on("error", (error) => {
      console.error(error);
    });
  }
  return childProcess;
};
