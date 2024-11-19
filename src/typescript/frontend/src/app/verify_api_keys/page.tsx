import { AccountAddress } from "@aptos-labs/ts-sdk";
import { APTOS_API_KEY } from "@sdk/const";
import { getAptosClient } from "@sdk/utils/aptos-client";

export const dynamic = "force-static";
export const revalidate = 600;
export const runtime = "nodejs";

const VerifyApiKeys = async () => {
  const { aptos } = getAptosClient();
  const accountAddress = AccountAddress.ONE;
  let balance = 0;
  try {
    balance = await aptos.account.getAccountAPTAmount({ accountAddress });
  } catch (e) {
    const msg = `\n\tLikely an invalid API key. APTOS_API_KEY: ${APTOS_API_KEY}`;
    throw new Error(`Couldn't fetch ${accountAddress}'s balance. ${msg}`);
  }

  return (
    <div className="bg-black w-full h-full m-auto pixel-heading-2">{`Balance: ${balance}`}</div>
  );
};

export default VerifyApiKeys;
