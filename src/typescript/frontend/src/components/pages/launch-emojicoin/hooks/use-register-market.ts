import { RegisterMarket } from "@/contract-apis/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  Ed25519PublicKey,
  isUserTransactionResponse,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { INTEGRATOR_ADDRESS } from "lib/env";
import {
  MARKET_REGISTRATION_FEE,
  MARKET_REGISTRATION_GAS_ESTIMATION_FIRST,
  MARKET_REGISTRATION_GAS_ESTIMATION_NOT_FIRST,
} from "@sdk/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import { SYMBOL_EMOJI_DATA } from "@sdk/emoji_data";
import { useNumMarkets } from "lib/hooks/queries/use-num-markets";
import { useQuery } from "@tanstack/react-query";
import { type AccountInfo } from "@aptos-labs/wallet-adapter-core";
import { useNewCoinInput } from "context/new-coin-input-context";


export const tryEd25519PublicKey = (account: AccountInfo) => {
  try {
    return new Ed25519PublicKey(
      typeof account.publicKey === "string" ? account.publicKey : account.publicKey[0]
    );
  } catch (_) {
    return undefined;
  }
};

export const useRegisterMarket = () => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const setIsLoadingRegisteredMarket = useEmojiPicker(
    (state) => state.setIsLoadingRegisteredMarket
  );
  const clear = useEmojiPicker((state) => state.clear);
  const setPickerInvisible = useEmojiPicker((state) => state.setPickerInvisible);
  const { aptos, account, signThenSubmit } = useAptos();

  const { data: numMarkets } = useNumMarkets();

  const { name, description } = useNewCoinInput((s) => s)
  console.log('~~description: ', description);
console.log('~~name: ', name);

class HexInput extends Uint8Array {
  constructor(input: string | number[]) {
    if (typeof input === "string") {
      super([...input].map(char => char.charCodeAt(0))); // Convert string to Uint8Array
    } else {
      super(input); // Handle numeric byte array
    }
  }
}

// ✅ Convert a string to an array of HexInput elements (HexInput[])
function stringToHexInputArray(str: string): HexInput[] {
  return [...str].map(char => new HexInput([char.charCodeAt(0)])); 
}

// Example usage


// Example usage:
const a = name + description

function stringToHexArray(str: string): string[] {
  return [...str].map(char => `0x${char.codePointAt(0)?.toString(16).padStart(8, "0")}`);
}

// Example usage
const emojiBytes = stringToHexArray(a);

  console.log('~~emojiBytes: ', emojiBytes);

  const { data: gasResult } = useQuery({
    queryKey: ["register-market-cost", numMarkets, account?.address, emojiBytes],
    queryFn: async () => {
      if (account === null) {
        return undefined;
      }
      const publicKey = tryEd25519PublicKey(account);
      if (!publicKey) {
        return {
          error: true,
          data: {
            amount: 0,
            unitPrice: 0,
          },
        };
      }
      try {
        const r = await RegisterMarket.getGasCost({
          aptosConfig: aptos.config,
          registrant: account.address,
          registrantPubKey: publicKey,
          emojis: numMarkets === 0 ? [SYMBOL_EMOJI_DATA.byName("Virgo")!.bytes] : emojiBytes,
        });
        return r;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
    staleTime: 1000,
    enabled:
      numMarkets !== undefined && account !== null && (numMarkets === 0 || emojis.length > 0),
  });

  let amount: number, unitPrice: number;

  if (gasResult && !gasResult.error) {
    amount = gasResult.data.amount;
    unitPrice = gasResult.data.unitPrice;
  } else {
    // If numMarkets is undefined (request not completed yet), we are ok with displaying the bigger number.
    // And in most cases (every time except for the first market), it will actually be the correct one.
    amount =
      numMarkets === 0
        ? MARKET_REGISTRATION_GAS_ESTIMATION_FIRST / 100
        : MARKET_REGISTRATION_GAS_ESTIMATION_NOT_FIRST / 100;
    unitPrice = 100;
  }

  const registerMarket = async () => {
    if (!account) {
      return;
    }
    // Set the picker invisible for the duration of the registration transaction.
    setPickerInvisible(true);
    let res: PendingTransactionResponse | UserTransactionResponse | undefined | null;
    let error: unknown;
    const builderArgs = {
      aptosConfig: aptos.config,
      registrant: account.address,
      emojis: emojiBytes,
      integrator: INTEGRATOR_ADDRESS,
    };
    const builderLambda = () =>
      RegisterMarket.builder({
        ...builderArgs,
        options: {
          maxGasAmount: Math.round(amount * 1.2),
          gasUnitPrice: unitPrice,
        },
      });
    await signThenSubmit(builderLambda).then((r) => {
      res = r?.response ?? null;
      error = r?.error;
    });

    if (res && isUserTransactionResponse(res)) {
      clear();
      // The event is parsed and added as a registered market in `event-store.ts`,
      // we don't need to do anything here other than set the loading state.
      setIsLoadingRegisteredMarket(true);
    } else {
      // If the transaction fails or the user cancels the transaction, we unset the loading state
      // and set the picker visible.
      // Note that we don't clear the input here, because the user may want to alter it to make it
      // correct and try again.
      setPickerInvisible(false);
      console.error("Error registering market:", error);
      setIsLoadingRegisteredMarket(false);
    }
  };

  // By default, just consider that this is the price, since in 99.99% of cases, this will be the most accurate estimate.
  let cost: number = Number(MARKET_REGISTRATION_FEE);

  // If numMarkets is undefined (request not completed yet), we are ok with choosing the second option.
  // And in most cases (every time except for the first market), it will actually be the correct one.
  if (numMarkets === 0) {
    cost = amount * unitPrice;
  } else {
    cost += amount * unitPrice;
  }

  return {
    registerMarket,
    cost,
  };
};
