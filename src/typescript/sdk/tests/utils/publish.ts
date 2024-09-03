import { execSync } from "child_process";
import {
  type AccountAddressInput,
  Hex,
  Network,
  NetworkToNodeAPI,
  type PrivateKey,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import path from "path";
import { type PublishPackageResult, type ResultJSON } from "./types";
import { getAptosClient } from "./aptos-client";
import { MAX_GAS_FOR_PUBLISH, ONE_APT, EMOJICOIN_DOT_FUN_MODULE_NAME } from "../../src";
import { getGitRoot } from "./helpers";

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
    aptosExecutableAvailable ? "npx @aptos-labs/aptos-cli" : "aptos",
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
    "--override-size-check",
  ];

  const command = shellArgs.join(" ");
  console.debug(`\n${command}\n`);
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
    sender: result.sender,
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

  /* eslint-disable no-console */
  console.error(`Command: ${originalCommand}`);
  console.error("Result:");
  console.error(text);
  /* eslint-enable no-console */
  return null;
}

export async function publishForTest(pk: string): Promise<PublishPackageResult> {
  const { aptos } = getAptosClient();
  const publisher = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(Hex.fromHexString(pk).toUint8Array()),
  });

  let publisherBalance = await aptos.account
    .getAccountAPTAmount({ accountAddress: publisher.accountAddress })
    .catch((_) => 0);

  if (process.env.NEXT_PUBLIC_APTOS_NETWORK !== "local") {
    const APT_REQUIRED_FOR_TESTS = 4;
    while (publisherBalance < APT_REQUIRED_FOR_TESTS * ONE_APT) {
      /* eslint-disable-next-line no-await-in-loop */
      await aptos.fundAccount({ accountAddress: publisher.accountAddress, amount: ONE_APT * 1 });
      publisherBalance += ONE_APT;
    }
  } else {
    await aptos.fundAccount({ accountAddress: publisher.accountAddress, amount: ONE_APT * 1000 });
  }

  const moduleName = EMOJICOIN_DOT_FUN_MODULE_NAME;
  const packageName = moduleName;
  return publishPackage({
    pk: publisher.privateKey,
    includedArtifacts: "none",
    namedAddresses: {
      [packageName]: publisher.accountAddress,
    },
    network: Network.LOCAL,
    packageDirRelativeToRoot: `src/move/${packageName}`,
  });
}

export async function getModuleExists(
  publisherAddress: AccountAddressInput,
  moduleName: string
): Promise<boolean> {
  const { aptos } = getAptosClient();
  const abiExists =
    typeof (
      await aptos.account.getAccountModule({
        accountAddress: publisherAddress,
        moduleName,
      })
    ).abi !== "undefined";
  return abiExists;
}
