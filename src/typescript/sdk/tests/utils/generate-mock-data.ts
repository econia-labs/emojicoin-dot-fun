import { Account, type HexInput, type Aptos, type Uint64, Hex } from "@aptos-labs/ts-sdk";
import {
  EmojicoinDotFun,
  type TypeTagInput,
  getRegistryAddress,
} from "../../src/emojicoin_dot_fun";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets";
import type { EmojicoinInfo } from "../../src/types/contract";
import { Lazy, ONE_APT, ONE_APTN } from "../../src";

type RegisterMarketAction = {
  emojis: Array<HexInput>;
  account: Account;
};

type ProvideLiquidityAction = {
  account: Account;
  emojicoin: Lazy<EmojicoinInfo>;
  quoteAmount: Uint64;
};

type RemoveLiquidityAction = {
  account: Account;
  emojicoin: Lazy<EmojicoinInfo>;
  lpCoinAmount: Uint64;
};

type SwapAction = {
  account: Account;
  emojicoin: Lazy<EmojicoinInfo>;
  inputAmount: Uint64;
  isSell: boolean;
};

type ChatAction = {
  account: Account;
  emojicoin: Lazy<EmojicoinInfo>;
  emojiBytes: Array<HexInput>;
  emojiIndicesSequence: HexInput;
};

type Action =
  | { type: "registerMarket"; data: RegisterMarketAction }
  | { type: "provideLiquidity"; data: ProvideLiquidityAction }
  | { type: "removeLiquidity"; data: RemoveLiquidityAction }
  | { type: "swap"; data: SwapAction }
  | { type: "chat"; data: ChatAction };

export const MOCK_DATA_MARKETS_EMOJIS = [["f09fa5b0", "f09fa5b0"], ["f09f9094"], ["f09f8f81"]];

const concatEmoji = (a: Array<HexInput>) =>
  a.map((v) => Hex.fromHexInput(v).toStringWithoutPrefix()).join("");

export const generateMockData = async (aptos: Aptos, publisher: Account) => {
  const registryAddress = await getRegistryAddress({
    aptos,
    moduleAddress: publisher.accountAddress,
  });

  // Create and fund accounts
  const accounts = [0, 1, 2, 3, 4, 5].map((_) => Account.generate());
  for (const account of accounts) {
    /* eslint-disable-next-line no-await-in-loop */
    await aptos.fundAccount({
      accountAddress: account.accountAddress,
      amount: 100_000_000_000 * ONE_APT,
    });
  }

  const emojicoins = MOCK_DATA_MARKETS_EMOJIS.map(
    (e) =>
      new Lazy(() =>
        getEmojicoinMarketAddressAndTypeTags({
          registryAddress,
          symbolBytes: concatEmoji(e),
        })
      )
  );

  // Register all markets by accounts 0, 1 and 2
  let n = 0;
  const actions: Action[] = MOCK_DATA_MARKETS_EMOJIS.map((e) => {
    const data: {
      type: "registerMarket";
      data: RegisterMarketAction;
    } = {
      type: "registerMarket",
      data: {
        emojis: e,
        account: accounts[n],
      },
    };
    n += 1;
    return data;
  });

  // Make 100 swaps by all accounts on each market
  for (let i = 1; i <= emojicoins.length; i += 1) {
    for (let j = 1n; j <= 100n; j += 1n) {
      actions.push({
        type: "swap",
        data: {
          account: accounts[Number(j) % 3],
          emojicoin: emojicoins[i - 1],
          isSell: false,
          inputAmount: j * ONE_APTN * BigInt(10 ** (emojicoins.length - i)),
        },
      });
    }
  }

  // Make one swap on each market with account 0
  for (const emojicoin of emojicoins) {
    actions.push({
      type: "swap",
      data: {
        account: accounts[0],
        emojicoin,
        isSell: false,
        inputAmount: ONE_APTN,
      },
    });
  }

  // Make one sell swap on each market with account 0
  for (const emojicoin of emojicoins) {
    actions.push({
      type: "swap",
      data: {
        account: accounts[0],
        emojicoin,
        isSell: true,
        inputAmount: ONE_APTN * 3n,
      },
    });
  }

  // Sell back some tokens to bring prices to a reasonable amount
  actions.push({
    type: "swap",
    data: {
      account: accounts[0],
      emojicoin: emojicoins[0],
      isSell: true,
      inputAmount: 14000000000000000n,
    },
  });
  actions.push({
    type: "swap",
    data: {
      account: accounts[1],
      emojicoin: emojicoins[0],
      isSell: true,
      inputAmount: 14000000000000000n,
    },
  });
  actions.push({
    type: "swap",
    data: {
      account: accounts[2],
      emojicoin: emojicoins[0],
      isSell: true,
      inputAmount: 14000000000000000n,
    },
  });

  // Creating whale (~42.17% of supply)
  actions.push({
    type: "swap",
    data: {
      account: accounts[3],
      emojicoin: emojicoins[0],
      isSell: false,
      inputAmount: ONE_APTN * 50000n,
    },
  });

  // Creating dolphin (~3.12% of supply)
  actions.push({
    type: "swap",
    data: {
      account: accounts[4],
      emojicoin: emojicoins[0],
      isSell: false,
      inputAmount: ONE_APTN * 200000n,
    },
  });

  // Creating puffer fish (~0.0003% of supply)
  actions.push({
    type: "swap",
    data: {
      account: accounts[5],
      emojicoin: emojicoins[0],
      isSell: false,
      inputAmount: ONE_APTN * 100n,
    },
  });

  // Provide and remove some liquidity
  for (let i = 0n; i < 10n; i += 1n) {
    actions.push({
      type: "provideLiquidity",
      data: {
        account: accounts[3],
        emojicoin: emojicoins[0],
        quoteAmount: (i + (i % 2n === 0n ? 1000000n : 500000n)) * ONE_APTN,
      },
    });
    actions.push({
      type: "removeLiquidity",
      data: {
        account: accounts[3],
        emojicoin: emojicoins[0],
        lpCoinAmount: (i + (i % 2n === 0n ? 50n : 100n)) * ONE_APTN,
      },
    });
  }

  // Make each account chat once on each market
  for (const emojicoin of emojicoins) {
    for (const account of accounts) {
      actions.push({
        type: "chat",
        data: {
          account,
          emojicoin,
          emojiBytes: ["f09f8f81"],
          emojiIndicesSequence: new Uint8Array([0]),
        },
      });
    }
  }

  await execute(aptos, actions);
};

const getTypeTags = (lazy: Lazy<EmojicoinInfo>): [TypeTagInput, TypeTagInput] => [
  lazy.get().emojicoin,
  lazy.get().emojicoinLP,
];

async function execute(aptos: Aptos, actions: Action[]) {
  const defaultTx = {
    aptosConfig: aptos.config,
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
    integrator: Account.generate().accountAddress,
  };
  const defaultTxWithMarket = (emojicoin: Lazy<EmojicoinInfo>) => ({
    aptosConfig: aptos.config,
    marketAddress: emojicoin.get().marketAddress,
    typeTags: getTypeTags(emojicoin),
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
    integrator: Account.generate().accountAddress,
  });
  for (const action of actions) {
    if (action.type === "registerMarket") {
      /* eslint-disable-next-line no-await-in-loop */
      await EmojicoinDotFun.RegisterMarket.submit({
        ...defaultTx,
        registrant: action.data.account,
        emojis: action.data.emojis,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "swap") {
      /* eslint-disable-next-line no-await-in-loop */
      await EmojicoinDotFun.Swap.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        swapper: action.data.account,
        inputAmount: action.data.inputAmount,
        isSell: action.data.isSell,
        integratorFeeRateBps: 0,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "provideLiquidity") {
      /* eslint-disable-next-line no-await-in-loop */
      await EmojicoinDotFun.ProvideLiquidity.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        provider: action.data.account,
        quoteAmount: action.data.quoteAmount,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "removeLiquidity") {
      /* eslint-disable-next-line no-await-in-loop */
      await EmojicoinDotFun.RemoveLiquidity.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        provider: action.data.account,
        lpCoinAmount: action.data.lpCoinAmount,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "chat") {
      /* eslint-disable-next-line no-await-in-loop */
      await EmojicoinDotFun.Chat.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        user: action.data.account,
        emojiBytes: action.data.emojiBytes,
        emojiIndicesSequence: action.data.emojiIndicesSequence,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else {
      /* eslint-disable-next-line no-console */
      console.error("Got wrong action type.");
    }
  }
}
