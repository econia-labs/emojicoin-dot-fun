import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { WalletModal } from "components/wallet/WalletModal";

export type WalletModalContextState = {
  connectWallet: () => void;
};

export const WalletModalContext = createContext<WalletModalContextState | undefined>(undefined);

export function WalletModalContextProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState<boolean>(false);
  const value: WalletModalContextState = {
    connectWallet: () => {
      setOpen(true);
    },
  };

  return (
    <WalletModalContext.Provider value={value}>
      {children}
      <WalletModal open={open} setOpen={setOpen} />
    </WalletModalContext.Provider>
  );
}

export const useWalletModal = (): WalletModalContextState => {
  const context = useContext(WalletModalContext);
  if (context == null) {
    throw new Error("useWalletModal must be used within a WalletModalContext.");
  }
  return context;
};
