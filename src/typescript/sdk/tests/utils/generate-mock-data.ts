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

export let generateMockData = async (aptos: Aptos, account: Account) => {
  const emojis = ["f09fa5b0", "f09fa5b0"];

  const registryAddress = await getRegistryAddress({
    aptos,
    moduleAddress: account.accountAddress,
  });

  const lazyEmojicoin: Lazy<EmojicoinInfo> = new Lazy(() => getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes: emojis.map((v) => Hex.fromHexInput(v).toStringWithoutPrefix()).join(""),
  }));

  const actions: Action[] = [{
    type: 'registerMarket',
    data: {
      emojis,
      account,
    }
  }];

  for(let i = 1n; i <= 100n; i++) {
    actions.push({
      type: 'swap',
      data: {
        account,
        emojicoin: lazyEmojicoin,
        isSell: false,
        inputAmount: i * ONE_APTn,
      },
    })
  }

  //for(let i = 0n; i < 10n; i++) {
  //  actions.push({
  //    type: 'provideLiquidity',
  //    data: {
  //      account,
  //      emojicoin: lazyEmojicoin,
  //      quoteAmount: 100n * ONE_APTn,
  //    },
  //  })
  //}
  //
  //for(let i = 0n; i < 5n; i++) {
  //  actions.push({
  //    type: 'removeLiquidity',
  //    data: {
  //      account,
  //      emojicoin: lazyEmojicoin,
  //      lpCoinAmount: 100n * ONE_APTn,
  //    },
  //  })
  //}

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
