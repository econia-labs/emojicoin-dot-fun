import { Account, HexInput, type Aptos, Uint64, Hex } from "@aptos-labs/ts-sdk";
import { EmojicoinDotFun, TypeTagInput, getRegistryAddress } from "../../src/emojicoin_dot_fun";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets";
import { EmojicoinInfo } from "../../src/types/contract";
import { Lazy, ONE_APT } from "../../src";

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

const ONE_APTn = BigInt(ONE_APT);

export const MOCK_DATA_MARKETS_EMOJIS = [["f09fa5b0", "f09fa5b0"], ["f09f9094"], ["f09f8f81"]];

const concatEmoji = (a: Array<HexInput>) => {
  return a.map((v) => Hex.fromHexInput(v).toStringWithoutPrefix()).join("");
};

export let generateMockData = async (aptos: Aptos, account: Account) => {
  const registryAddress = await getRegistryAddress({
    aptos,
    moduleAddress: account.accountAddress,
  });

  // Create and fund accounts
  let accounts = [0, 1, 2, 3, 4, 5].map((_) => Account.generate());
  for (const account of accounts) {
    await aptos.fundAccount({
      accountAddress: account.accountAddress,
      amount: 100000000 * ONE_APT,
    });
  }

  let emojicoins = MOCK_DATA_MARKETS_EMOJIS.map((e) => {
    return new Lazy(() =>
      getEmojicoinMarketAddressAndTypeTags({
        registryAddress,
        symbolBytes: concatEmoji(e),
      })
    );
  });

  // Register all markets by accounts 0, 1 and 2
  let n = 0;
  const actions: Action[] = MOCK_DATA_MARKETS_EMOJIS.map((e) => {
    let data: {
      type: "registerMarket";
      data: RegisterMarketAction;
    } = {
      type: "registerMarket",
      data: {
        emojis: e,
        account: accounts[n],
      },
    };
    n++;
    return data;
  });

  // Make 100 swaps by all accounts on each market
  for (let i = 1; i <= emojicoins.length; i++) {
    for (let j = 1n; j <= 100n; j++) {
      actions.push({
        type: "swap",
        data: {
          account: accounts[Number(j) % 3],
          emojicoin: emojicoins[i - 1],
          isSell: false,
          inputAmount: j * ONE_APTn * BigInt(Math.pow(10, emojicoins.length - i)),
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
        inputAmount: ONE_APTn,
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
        inputAmount: ONE_APTn * 3n,
      },
    });
  }

  // Creating whale
  actions.push({
    type: "swap",
    data: {
      account: accounts[3],
      emojicoin: emojicoins[0],
      isSell: false,
      inputAmount: ONE_APTn * 100000n,
    },
  });

  // Creating dolphin
  actions.push({
    type: "swap",
    data: {
      account: accounts[4],
      emojicoin: emojicoins[0],
      isSell: false,
      inputAmount: ONE_APTn * 2000n,
    },
  });

  // Creating puffer fish
  actions.push({
    type: "swap",
    data: {
      account: accounts[5],
      emojicoin: emojicoins[0],
      isSell: false,
      inputAmount: ONE_APTn * 10n,
    },
  });

  // Provide and remove some liquidity
  for (let i = 0n; i < 10n; i++) {
    actions.push({
      type: "provideLiquidity",
      data: {
        account: accounts[0],
        emojicoin: emojicoins[0],
        quoteAmount: (i + (i % 2n == 0n ? 1000n : 500n)) * ONE_APTn,
      },
    });
    actions.push({
      type: "removeLiquidity",
      data: {
        account: accounts[0],
        emojicoin: emojicoins[0],
        lpCoinAmount: (i + (i % 2n == 0n ? 500n : 1000n)) * ONE_APTn,
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

const getTypeTags = (lazy: Lazy<EmojicoinInfo>): [TypeTagInput, TypeTagInput] => {
  return [lazy.get().emojicoin, lazy.get().emojicoinLP];
};

async function execute(aptos: Aptos, actions: Action[]) {
  const defaultTx = {
    aptosConfig: aptos.config,
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
    integrator: Account.generate().accountAddress,
  };
  const defaultTxWithMarket = (emojicoin: Lazy<EmojicoinInfo>) => {
    return {
      aptosConfig: aptos.config,
      marketAddress: emojicoin.get().marketAddress,
      typeTags: getTypeTags(emojicoin),
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
      integrator: Account.generate().accountAddress,
    };
  };
  for (const action of actions) {
    if (action.type === "registerMarket") {
      await EmojicoinDotFun.RegisterMarket.submit({
        ...defaultTx,
        registrant: action.data.account,
        emojis: action.data.emojis,
      }).catch(console.error);
    } else if (action.type === "swap") {
      await EmojicoinDotFun.Swap.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        swapper: action.data.account,
        inputAmount: action.data.inputAmount,
        isSell: action.data.isSell,
        integratorFeeRateBps: 0,
      }).catch(console.error);
    } else if (action.type === "provideLiquidity") {
      await EmojicoinDotFun.ProvideLiquidity.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        provider: action.data.account,
        quoteAmount: action.data.quoteAmount,
      }).catch(console.error);
    } else if (action.type === "removeLiquidity") {
      await EmojicoinDotFun.RemoveLiquidity.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        provider: action.data.account,
        lpCoinAmount: action.data.lpCoinAmount,
      }).catch(console.error);
    } else if (action.type === "chat") {
      await EmojicoinDotFun.Chat.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        user: action.data.account,
        emojiBytes: action.data.emojiBytes,
        emojiIndicesSequence: action.data.emojiIndicesSequence,
      }).catch(console.error);
    } else {
      console.error("Got wrong action type.");
    }
  }
}
