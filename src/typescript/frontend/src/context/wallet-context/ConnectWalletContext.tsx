import { useWallet, type WalletName } from "@aptos-labs/wallet-adapter-react";
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { BaseModal } from "components/modal/BaseModal";
import { WalletItem, isSupportedWallet, walletSort } from "./WalletItem";

export type ConnectWalletContextState = {
  connectWallet: () => void;
};

export const ConnectWalletContext = createContext<ConnectWalletContextState | undefined>(undefined);

const WalletItemClassName =
  "relative flex h-[45px] w-full items-center p-4 text-neutral-600" +
  "transition-all hover:text-ec-blue " +
  "text-black group";

let t: NodeJS.Timeout | null = null;
const AutoConnect = () => {
  const { account, connect } = useWallet();
  useEffect(() => {
    if (!account && localStorage.getItem("AptosWalletName")) {
      const f = async () => {
        try {
          await connect(localStorage.getItem("AptosWalletName") as WalletName);
        } catch (error) {
          if (t) {
            clearInterval(t);
          }
        }
      };
      f();
      t = setInterval(f, 100);
    } else if (t) {
      clearInterval(t);
    }
    return () => {
      if (t) {
        clearInterval(t);
      }
    };
  }, [account]); /* eslint-disable-line react-hooks/exhaustive-deps */

  return null;
};

export function ConnectWalletContextProvider({ children }: PropsWithChildren) {
  const { connect, wallet: activeWallet, wallets, disconnect } = useWallet();
  const [open, setOpen] = useState<boolean>(false);
  const value: ConnectWalletContextState = {
    connectWallet: () => {
      setOpen(true);
    },
  };

  return (
    <ConnectWalletContext.Provider value={value}>
      <AutoConnect />
      {children}
      <BaseModal
        className="md:w-[430px]"
        isOpen={open}
        onClose={() => setOpen(false)}
        onBack={() => setOpen(false)}
        showCloseButton={true}
      >
        <div className="px-[46px] py-[25.5px] bg-ec-blue">
          <div className="flex flex-col divide-y-2 divide-dotted divide-slate-800">
            <h2 className="text-center font-pixelar text-3xl text-black uppercase mb-2">
              Connect a Wallet
            </h2>
            {wallets
              ?.filter((wallet) => isSupportedWallet(wallet.name))
              ?.sort(walletSort)
              ?.map((wallet) => {
                return (
                  <WalletItem
                    wallet={wallet}
                    key={wallet.name}
                    className={
                      WalletItemClassName +
                      (wallet.name !== activeWallet?.name ? " hover:bg-black" : " hover:bg-black")
                    }
                    onClick={() => {
                      try {
                        if (wallet.name === activeWallet?.name) {
                          disconnect();
                        } else {
                          connect(wallet.name);
                        }
                      } catch (e) {
                        if (e instanceof Error) {
                          toast.error(e.message);
                        }
                      } finally {
                        setOpen(false);
                      }
                    }}
                  ></WalletItem>
                );
              })}
          </div>
        </div>
      </BaseModal>
    </ConnectWalletContext.Provider>
  );
}

export const useConnectWallet = (): ConnectWalletContextState => {
  const context = useContext(ConnectWalletContext);
  if (context == null) {
    throw new Error("useConnectWallet must be used within a ConnectWalletContext.");
  }
  return context;
};
