"use server";

import { fetchUserArenaEscrows } from "@/sdk/utils/arena/escrow";

export const fetchEscrowAction = async (userAddress?: `0x${string}`) => {
  if (!userAddress) return null;
  return await fetchUserArenaEscrows(userAddress);
};
