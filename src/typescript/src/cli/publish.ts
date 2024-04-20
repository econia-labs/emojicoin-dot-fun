import { execSync } from "child_process";
import {
  AccountAddress,
  type AccountAddressInput,
  Hex,
  type Network,
  NetworkToNodeAPI,
  type PrivateKey,
} from "@aptos-labs/ts-sdk";
import path from "path";
import { MAX_GAS_FOR_PUBLISH } from "../utils";
import { getGitRoot } from "../utils/helpers";
import { type PublishPackageResult, type ResultJSON } from "../types";

export async function publishPackage(args: {
  pk: PrivateKey;
  network: Network;
  includedArtifacts: string | undefined;
  namedAddresses: Record<string, AccountAddressInput>;
  packageDirRelativeToRoot: string;
}): Promise<PublishPackageResult> {
  const { pk, network, namedAddresses, packageDirRelativeToRoot: packageDirRelative } = args;
  const includedArtifacts = args.includedArtifacts || "none";

  let aptosExecutableAvailable = true;
  // Avoid using npx if aptos is installed globally already.
  try {
    execSync("aptos --version");
  } catch (e) {
    aptosExecutableAvailable = false;
  }

  const packageDir = path.join(getGitRoot(), packageDirRelative);

  const entries = Object.entries(namedAddresses);
  const namedAddressesString = entries
    .map(([name, address]) => `${name}=${address.toString()}`)
    .join(",");

  const pkString = new Hex(pk.toUint8Array()).toStringWithoutPrefix();

  const shellArgs = [
    aptosExecutableAvailable ? "npx aptos" : "aptos",
    "move",
    "publish",
    ...["--named-addresses", namedAddressesString],
    ...["--max-gas", MAX_GAS_FOR_PUBLISH.toString()],
    ...["--url", NetworkToNodeAPI[network]],
    ...["--package-dir", packageDir],
    ...["--included-artifacts", includedArtifacts],
    ...["--private-key", pkString],
    ...["--encoding", "hex"],
    "--assume-yes",
  ];

  const command = shellArgs.join(" ");
  const outputBytes = execSync(command);
  const commandOutput = Buffer.from(outputBytes).toString();
  const resultObject = extractJsonFromText(command, commandOutput);

  if (!resultObject) {
    throw new Error("Failed to parse JSON from output");
  }
  const result = resultObject.Result;
  return {
    transaction_hash: result.transaction_hash,
    gas_used: Number(result.gas_used),
    gas_unit_price: Number(result.gas_unit_price),
    sender: AccountAddress.from(result.sender),
    sequence_number: Number(result.sequence_number),
    success: Boolean(result.success),
    timestamp_us: Number(result.timestamp_us), // Microseconds.
    version: Number(result.version),
    vm_status: result.vm_status,
  };
}

function extractJsonFromText(originalCommand: string, text: string): ResultJSON | null {
  const regex = /\{\s*"Result"\s*:\s*\{[^}]*\}\s*\}/;
  const match = text.match(regex);

  if (match) {
    try {
      // Extract the JSON string and parse it
      const jsonString = match[0];
      const result: ResultJSON = JSON.parse(jsonString);
      return result;
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.error(`Command: ${originalCommand}`);
      /* eslint-disable-next-line no-console */
      console.error("Error parsing JSON:", error);
      return null;
    }
  }

  /* eslint-disable-next-line no-console */
  console.error(`Command: ${originalCommand}`);
  return null;
}
