import { Ed25519PrivateKey, Account } from "@aptos-labs/ts-sdk";
import { useUserSettings } from "context/event-store-context/hooks";
import { useMemo } from "react";

export const useClaimAccount = () => {
  const claimKey = useUserSettings((s) => s.claimKey);

  const account = useMemo(() => {
    try {
      if (claimKey !== undefined) {
        const privateKey = new Ed25519PrivateKey(Buffer.from(claimKey, "base64").subarray(16));
        return Account.fromPrivateKey({ privateKey });
      }
    } catch {
      null;
    }
    return undefined;
  }, [claimKey]);

  return account;
};
