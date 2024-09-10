// cspell:word kolorist
// cspell:word localnet

import { trueColor } from "kolorist";

// $NO_COLOR is already handled by `kolorist`.
const colorText = (r: number, g: number, b: number) => (text: string) => trueColor(r, g, b)(text);

export type ContainerName =
  | "local-testnet-indexer-api"
  | "local-testnet-postgres"
  | "broker"
  | "deployer"
  | "frontend"
  | "localnet"
  | "processor"
  | "postgres"
  | "postgrest";

// List of visually distinguishable RGB colors.
// Test printing with this: ██████████████████
const COLORS: [number, number, number][] = [
  [208, 96, 17], // Orange.
  [255, 225, 25], // Yellow.
  [70, 230, 60], // Green.
  [19, 151, 121], // Teal.
  [20, 30, 90], // Blue.
  [240, 40, 70], // Burnt red.
  [0, 40, 255], // Light blue.
];

const containerNames: ContainerName[] = [
  "local-testnet-indexer-api",
  "local-testnet-postgres",
  "broker",
  "deployer",
  "frontend",
  "localnet",
  "processor",
  "postgres",
  "postgrest",
];

// Fisher-Yates shuffle algorithm.
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
const shuffledColors = shuffleArray([...COLORS]);

const coloredNames = new Map<ContainerName, string>();
containerNames.forEach((containerName, index) => {
  const [r, g, b] = shuffledColors[index % shuffledColors.length];
  coloredNames.set(containerName, colorText(r, g, b)(containerName));
});

const colorLogs = (text: string) => text.split("\n").map(colorContainerName).join("\n");

const shouldPrint = (containerName: ContainerName) => {
  // @ts-ignore
  const filterLogsFrom = globalThis.__DOCKER_LOGS_FILTER__ as Array<ContainerName>;
  return !filterLogsFrom.includes(containerName);
};

const matchContainerLogs = (log: string | Buffer) => {
  if (typeof log === undefined) {
    return { logPrefix: undefined, containerName: undefined };
  }
  const text = log.toString();
  // The regular expression pattern for a valid Docker container name.
  const pattern = /^([a-zA-Z0-9][a-zA-Z0-9_.-]*)\s+\|/;
  const match = text.match(pattern);
  return {
    logPrefix: match?.[0],
    containerName: match?.[1] as ContainerName | undefined,
  };
};

const colorContainerName = (originalText: string) => {
  const { logPrefix, containerName } = matchContainerLogs(originalText);
  const nameWithColor = coloredNames.get(containerName ?? ("" as ContainerName));
  if (!containerName || !logPrefix || !nameWithColor) {
    return originalText;
  }
  // Now replace the string in the original text with the colored version.
  const newLogPrefix = logPrefix.replace(containerName, nameWithColor);
  return originalText.replace(logPrefix, newLogPrefix);
};

const printLogs = (log: string | Buffer) => {
  if (typeof log === "undefined" || log === null) {
    return;
  }
  const { containerName } = matchContainerLogs(log);
  // Filter out logs from containers that we shouldn't print.
  if (containerName && !shouldPrint(containerName)) {
    return;
  }
  let res = log.toString();
  if (containerName) {
    res = colorLogs(res);
  }
  console.debug(res);
};

export { printLogs, colorLogs };
