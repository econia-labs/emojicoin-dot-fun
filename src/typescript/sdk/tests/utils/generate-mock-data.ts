import { Account, HexInput, type Aptos, Uint64, Hex } from "@aptos-labs/ts-sdk";
import { EmojicoinDotFun, TypeTagInput, getRegistryAddress } from "../../src/emojicoin_dot_fun";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets";
import { EmojicoinInfo } from "../../src/types/contract";
import { Lazy, ONE_APT } from "../../src";

type RegisterMarketAction = {
  emojis: Array<HexInput>,
  account: Account,
};

type ProvideLiquidityAction = {
  account: Account,
  emojicoin: Lazy<EmojicoinInfo>,
  quoteAmount: Uint64,
}

type RemoveLiquidityAction = {
  account: Account,
  emojicoin: Lazy<EmojicoinInfo>,
  lpCoinAmount: Uint64,
}

type SwapAction = {
  account: Account,
  emojicoin: Lazy<EmojicoinInfo>,
  inputAmount: Uint64,
  isSell: boolean,
}

type Action =
  {type: 'registerMarket', data: RegisterMarketAction} |
  {type: 'provideLiquidity', data: ProvideLiquidityAction} |
  {type: 'removeLiquidity', data: RemoveLiquidityAction} |
  {type: 'swap', data: SwapAction};

const ONE_APTn = BigInt(ONE_APT);

export const MOCK_DATA_MARKET_EMOJIS = ["f09fa5b0", "f09fa5b0"];

const concatEmoji = (a: string[]) => {
  return a.map((v) => Hex.fromHexInput(v).toStringWithoutPrefix()).join("")
};

export let generateMockData = async (aptos: Aptos, account: Account) => {
  const registryAddress = await getRegistryAddress({
    aptos,
    moduleAddress: account.accountAddress,
  });

  let accounts = [0,1,2,3,4,5].map(_ => Account.generate());

  for(const account of accounts) {
    await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 100000000 * ONE_APT });
  }

  const lazyEmojicoin0: Lazy<EmojicoinInfo> = new Lazy(() => getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes: concatEmoji(["f09fa5b0", "f09fa5b0"]),
  }));
  const lazyEmojicoin1: Lazy<EmojicoinInfo> = new Lazy(() => getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes: concatEmoji(["f09f9094"]),
  }));
  const lazyEmojicoin2: Lazy<EmojicoinInfo> = new Lazy(() => getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes: concatEmoji(["f09f8f81"]),
  }));

  const actions: Action[] = [{
    type: 'registerMarket',
    data: {
      emojis: ["f09fa5b0", "f09fa5b0"],
      account: accounts[0],
    }
  },{
    type: 'registerMarket',
    data: {
      emojis: ["f09f9094"],
      account: accounts[1],
    }
  },{
    type: 'registerMarket',
    data: {
      emojis: ["f09f8f81"],
      account: accounts[2],
    }
  }];

  for(let i = 1n; i <= 100n; i++) {
    actions.push({
      type: 'swap',
      data: {
        account: accounts[Number(i) % 3],
        emojicoin: lazyEmojicoin0,
        isSell: false,
        inputAmount: i * ONE_APTn * 100n,
      },
    })
  }

  for(let i = 1n; i <= 100n; i++) {
    actions.push({
      type: 'swap',
      data: {
        account: accounts[Number(i) % 3],
        emojicoin: lazyEmojicoin1,
        isSell: false,
        inputAmount: i * ONE_APTn * 10n,
      },
    })
  }

  for(let i = 1n; i <= 100n; i++) {
    actions.push({
      type: 'swap',
      data: {
        account: accounts[Number(i) % 3],
        emojicoin: lazyEmojicoin2,
        isSell: false,
        inputAmount: i * ONE_APTn,
      },
    })
  }

  actions.push({
    type: 'swap',
    data: {
      account: accounts[0],
      emojicoin: lazyEmojicoin0,
      isSell: false,
      inputAmount: ONE_APTn,
    },
  })

  actions.push({
    type: 'swap',
    data: {
      account: accounts[0],
      emojicoin: lazyEmojicoin1,
      isSell: false,
      inputAmount: ONE_APTn,
    },
  })

  actions.push({
    type: 'swap',
    data: {
      account: accounts[0],
      emojicoin: lazyEmojicoin2,
      isSell: false,
      inputAmount: ONE_APTn,
    },
  })

  // Creating whale
  actions.push({
    type: 'swap',
    data: {
      account: accounts[3],
      emojicoin: lazyEmojicoin0,
      isSell: false,
      inputAmount: ONE_APTn * 100000n,
    },
  })
  // Creating dolphin
  actions.push({
    type: 'swap',
    data: {
      account: accounts[4],
      emojicoin: lazyEmojicoin0,
      isSell: false,
      inputAmount: ONE_APTn * 2000n,
    },
  })
  // Creating puffer fish
  actions.push({
    type: 'swap',
    data: {
      account: accounts[5],
      emojicoin: lazyEmojicoin0,
      isSell: false,
      inputAmount: ONE_APTn * 10n,
    },
  })

  for(let i = 0n; i < 10n; i++) {
    actions.push({
      type: 'provideLiquidity',
      data: {
        account: accounts[0],
        emojicoin: lazyEmojicoin0,
        quoteAmount: (i + (i % 2n == 0n ? 1000n : 500n)) * ONE_APTn,
      },
    })
    actions.push({
      type: 'removeLiquidity',
      data: {
        account: accounts[0],
        emojicoin: lazyEmojicoin0,
        lpCoinAmount: (i + (i % 2n == 0n ? 500n : 1000n)) * ONE_APTn,
      },
    })
  }

  await execute(aptos, account, actions);

}

const getTypeTags = (lazy: Lazy<EmojicoinInfo>): [TypeTagInput, TypeTagInput] => {
  return [lazy.get().emojicoin, lazy.get().emojicoinLP];
}

async function execute(aptos: Aptos, account: Account, actions: Action[]) {
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
  for(const action of actions) {
    if(action.type === 'registerMarket'){
      await EmojicoinDotFun.RegisterMarket.submit({
        registrant: account,
        emojis: action.data.emojis,
        ...defaultTx
      }).catch(console.error);
    } else if(action.type === 'swap') {
      await EmojicoinDotFun.Swap.submit({
        swapper: account,
        inputAmount: action.data.inputAmount,
        isSell: action.data.isSell,
        integratorFeeRateBps: 0,
        ...defaultTxWithMarket(action.data.emojicoin),
      }).catch(console.error);
    } else if(action.type === 'provideLiquidity') {
      await EmojicoinDotFun.ProvideLiquidity.submit({
        provider: account,
        quoteAmount: action.data.quoteAmount,
        ...defaultTxWithMarket(action.data.emojicoin),
      }).catch(console.error);
    } else if(action.type === 'removeLiquidity') {
      await EmojicoinDotFun.RemoveLiquidity.submit({
        provider: account,
        lpCoinAmount: action.data.lpCoinAmount,
        ...defaultTxWithMarket(action.data.emojicoin),
      }).catch(console.error);
    } else {
      console.error("Got wrong action type.");
    }
  }
}
