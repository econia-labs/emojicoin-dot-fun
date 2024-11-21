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
import { getAptosClient } from "../aptos-client";
import { MAX_GAS_FOR_PUBLISH, ONE_APT, EMOJICOIN_DOT_FUN_MODULE_NAME } from "../..";
import { getGitRoot } from "./helpers";

type ResultJSON = {
  Result: {
    transaction_hash: string;
    gas_used: number;
    gas_unit_price: number;
    sender: string;
    sequence_number: number;
    success: boolean;
    timestamp_us: number;
    version: number;
    vm_status: string;
  };
};

export async function publishPackage(args: {
  privateKey: PrivateKey;
  network: Network;
  includedArtifacts: string | undefined;
  namedAddresses: Record<string, AccountAddressInput>;
  packageDirRelativeToRoot: string;
}): Promise<ResultJSON["Result"]> {
  const {
    privateKey,
    network,
    namedAddresses,
    packageDirRelativeToRoot: packageDirRelative,
  } = args;
  const includedArtifacts = args.includedArtifacts || "none";

  try {
    execSync("aptos --version");
  } catch (e) {
    throw new Error("Please install the `aptos` executable before running these tests.");
  }

  const packageDir = path.join(getGitRoot(), packageDirRelative);

  const entries = Object.entries(namedAddresses);
  const namedAddressesString = entries
    .map(([name, address]) => `${name}=${address.toString()}`)
    .join(",");

  const privateKeyString = new Hex(privateKey.toUint8Array()).toStringWithoutPrefix();

  const shellArgs = [
    "aptos",
    "move",
    "publish",
    ...["--named-addresses", namedAddressesString],
    ...["--max-gas", MAX_GAS_FOR_PUBLISH.toString()],
    ...["--url", NetworkToNodeAPI[network]],
    ...["--package-dir", packageDir],
    ...["--included-artifacts", includedArtifacts],
    ...["--private-key", privateKeyString],
    ...["--encoding", "hex"],
    "--assume-yes",
    "--override-size-check",
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

  console.debug(`Command: ${originalCommand}`);
  console.debug("Result:");
  console.debug(text);
  return null;
}

export async function publishForTest(privateKeyString: string) {
  const aptos = getAptosClient();
  const publisher = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(Hex.fromHexString(privateKeyString).toUint8Array()),
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
    privateKey: publisher.privateKey,
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
  const aptos = getAptosClient();
  const abiExists =
    typeof (
      await aptos.account.getAccountModule({
        accountAddress: publisherAddress,
        moduleName,
      })
    ).abi !== "undefined";
  return abiExists;
}
