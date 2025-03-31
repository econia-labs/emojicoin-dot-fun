import { fetchMarketsWithCount } from "@/queries/home";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { VERCEL } from "@sdk/const";
import { getAptosClient } from "@sdk/utils/aptos-client";
import { CDN_URL } from "lib/env";
import { getAptPrice } from "lib/queries/get-apt-price";

export const dynamic = "force-static";
export const revalidate = 600;
export const runtime = "nodejs";

const VerifyApiKeys = async () => {
  if (VERCEL === false) return <></>;
  /* eslint-disable-next-line no-console */
  console.warn("The API keys are being verified.");

  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toUpperCase();
  const serverKey = process.env[`SERVER_${network}_APTOS_API_KEY`];
  const clientKey = process.env[`NEXT_PUBLIC_${network}_APTOS_API_KEY`];
  if (!clientKey) {
    throw new Error("Client Aptos API key not set.");
  }
  if (!serverKey) {
    throw new Error("Server Aptos API key not set.");
  }
  if (serverKey === clientKey) {
    throw new Error("Server Aptos API and client Aptos key are the same.");
  }

  const clientAptos = getAptosClient({ clientConfig: { API_KEY: clientKey } });
  const serverAptos = getAptosClient({ clientConfig: { API_KEY: serverKey } });

  const accountAddress = AccountAddress.ONE;

  // Check that the client-side Aptos API key works.
  try {
    await clientAptos.account.getAccountAPTAmount({ accountAddress });
  } catch (e) {
    const msg = "\n\tLikely an invalid client API key.";
    throw new Error(`Couldn't fetch ${accountAddress}'s balance on the client. ${msg}`);
  }

  // Check that the server-side Aptos API key works.
  try {
    await serverAptos.account.getAccountAPTAmount({ accountAddress });
  } catch (e) {
    const msg = "\n\tLikely an invalid server API key.";
    throw new Error(`Couldn't fetch ${accountAddress}'s balance on the server. ${msg}`);
  }

  const res = await fetchMarketsWithCount({});
  if (res.error) {
    const msg = "\n\tLikely an invalid indexer API key.";
    throw new Error(`Couldn't fetch the price feed on the server. ${msg}`);
  }

  // Check that CoinGecko API key works
  try {
    await getAptPrice();
  } catch (e) {
    throw new Error(`Couldn't fetch APT price.\n\tInvalid CoinGecko API key.`);
  }

  // Just to be extra safe- ensure the CDN_URL is set.
  let cdn: URL | null;
  try {
    cdn = new URL(CDN_URL);
  } catch {
    cdn = null;
  }
  if (CDN_URL === "" || CDN_URL === undefined || cdn === null) {
    throw new Error(`CDN_URL isn't properly set: ${CDN_URL}`);
  }

  return <div className="bg-black w-full h-full m-auto pixel-heading-2">LGTM</div>;
};

export default VerifyApiKeys;
