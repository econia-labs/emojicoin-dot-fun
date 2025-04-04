import { ViewFavorites } from "@/move-modules";
import { getAptosClient } from "@/sdk/utils";

export async function getFavorites(address: string) {
  const aptos = getAptosClient();
  return ViewFavorites.view({ aptos, user: address }).then((res) => res);
}
