/* eslint-disable no-await-in-loop */
import { Account, type HexInput, type Aptos, type Uint64, Hex } from "@aptos-labs/ts-sdk";
import type { Sql } from "postgres";
import postgres from "postgres";
import {
  EmojicoinDotFun,
  type TypeTagInput,
  getRegistryAddress,
  deriveEmojicoinPublisherAddress,
} from "../../src/emojicoin_dot_fun";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets";
import type { EmojicoinInfo } from "../../src/types/contract";
import { Lazy, ONE_APT, ONE_APTN, getMarketResource } from "../../src";

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

type MarketMetadata = {
  market_id: bigint;
  market_address: string;
  emoji_bytes: string;
};

type PeriodicStateMetadata = {
  start_time: bigint;
  period: bigint;
  emit_time: bigint;
  emit_market_nonce: bigint;
  trigger: bigint;
};

type PeriodicState = {
  market_metadata: MarketMetadata;
  periodic_state_metadata: PeriodicStateMetadata;
  open_price_q64: bigint;
  high_price_q64: bigint;
  low_price_q64: bigint;
  close_price_q64: bigint;
  volume_base: bigint;
  volume_quote: bigint;
  integrator_fees: bigint;
  pool_fees_base: bigint;
  pool_fees_quote: bigint;
  n_swaps: bigint;
  n_chat_messages: bigint;
  starts_in_bonding_curve: boolean;
  ends_in_bonding_curve: boolean;
  tvl_per_lp_coin_growth_q64: bigint;
};

const insertPeriodicState = async (
  state: PeriodicState,
  account: string,
  eventType: string,
  sql: Sql
) => {
  const seq = Number(100000n + state.periodic_state_metadata.emit_market_nonce);
  const time = new Date(Number(state.periodic_state_metadata.emit_time) / 1000);
  const res = await sql`
    INSERT INTO events VALUES (${seq}, 6, ${account}, ${seq}, ${seq}, ${eventType}, ${sql.json(JSON.parse(JSON.stringify(state, (_, v) => (typeof v === "bigint" ? v.toString() : v))))}, ${time.toISOString()}, 0, ${eventType})
  `;
};

const generatePeriodicStates = async (
  emojicoin: Lazy<EmojicoinInfo>,
  emojiBytes: string,
  marketId: bigint,
  account: string,
  eventType: string,
  sql: Sql
) => {
  const marketMetadata: MarketMetadata = {
    market_id: marketId,
    market_address: emojicoin.get().marketAddress.toString(),
    emoji_bytes: emojiBytes,
  };
  const now = BigInt(new Date().getTime()) * 1000n;
  const minute = 60_000_000n;
  let nonce = 1n;
  let openPrice = 0n;
  let highPrice = 0n;
  let lowPrice = 0n;
  let closePrice = 0n;
  let volumeBase = 0n;
  let volumeQuote = 0n;
  let nSwaps = 0n;
  let nChats = 0n;
  let sum = 0n;
  const events = [];
  const eventsAll = [];
  for (let i = 7 * 24 * 60; i > 10; i -= 1) {
    const startTime = BigInt(now - minute * BigInt(i));
    const emitTime = startTime + minute;
    const emitMarketNonce = nonce + 1n;
    nonce += 1n;

    const periodicStateMetadata: PeriodicStateMetadata = {
      start_time: startTime,
      period: minute,
      emit_time: emitTime,
      emit_market_nonce: emitMarketNonce,
      trigger: 0n,
    };

    const q64 = (n: bigint) => BigInt(Number(n) * (1 << 64));

    highPrice = 1000n + BigInt(Math.round(Math.random() * 100));
    lowPrice = 1000n - BigInt(Math.round(Math.random() * 100));
    openPrice = closePrice;
    let diff =
      (BigInt(Math.round(Math.random() * 100)) % (lowPrice - 1000n || 1n)) *
      (Math.random() > 0.5 ? -1n : 1n);
    if (diff < 0) {
      diff %= lowPrice - 1000n || 1n;
    } else {
      diff %= highPrice - 1000n || 1n;
    }
    closePrice = 1000n + diff;

    volumeBase = 1000n * BigInt(Math.round(Math.random() * 10));
    volumeQuote = volumeBase * ((closePrice + openPrice) / 2n);
    const startsInBondingCurve = sum < ONE_APTN * 10_000n;
    sum += volumeBase;
    const integratorFees = volumeBase * 1000n;

    let poolFeesBase: bigint;
    let poolFeesQuote: bigint;

    if (sum >= ONE_APTN * 10_000n) {
      poolFeesBase = volumeBase * 1000n;
      poolFeesQuote = poolFeesBase * ((closePrice + openPrice) / 2n);
    } else {
      poolFeesBase = 0n;
      poolFeesQuote = 0n;
    }

    nSwaps = BigInt(Math.round(Math.random() * 10));
    nChats = BigInt(Math.round(Math.random() * 20));

    const endsInBondingCurve = sum >= ONE_APTN * 10_000n;

    const periodicState: PeriodicState = {
      market_metadata: marketMetadata,
      periodic_state_metadata: periodicStateMetadata,
      open_price_q64: q64(openPrice),
      high_price_q64: q64(highPrice),
      low_price_q64: q64(lowPrice),
      close_price_q64: q64(closePrice),
      volume_base: volumeBase,
      volume_quote: volumeQuote,
      integrator_fees: integratorFees,
      pool_fees_base: poolFeesBase,
      pool_fees_quote: poolFeesQuote,
      n_swaps: nSwaps,
      n_chat_messages: nChats,
      starts_in_bonding_curve: startsInBondingCurve,
      ends_in_bonding_curve: endsInBondingCurve,
      tvl_per_lp_coin_growth_q64: 0n,
    };

    events.push(periodicState);
    eventsAll.push(periodicState);

    const unq64 = (n_q64: bigint) => BigInt(Number(n_q64) / (1 << 64));

    const factors = [5, 15, 30, 60, 60 * 4, 60 * 24];
    for (const factor of factors) {
      if (7 * 24 * 60 - (i % factor) === 0) {
        const lasts = events.slice(events.length - factor, events.length);
        const emitMarketNonce = nonce + 1n;
        nonce += 1n;
        const periodicStateMetadata2: PeriodicStateMetadata = {
          start_time: periodicStateMetadata.emit_time - minute * BigInt(factor),
          period: minute * BigInt(factor),
          emit_time: periodicStateMetadata.emit_time,
          emit_market_nonce: emitMarketNonce,
          trigger: 0n,
        };
        const periodicState: PeriodicState = {
          market_metadata: marketMetadata,
          periodic_state_metadata: periodicStateMetadata2,
          open_price_q64: q64(lasts.reduce((prev, curr) => prev + unq64(curr.open_price_q64), 0n)),
          high_price_q64: q64(lasts.reduce((prev, curr) => prev + unq64(curr.high_price_q64), 0n)),
          low_price_q64: q64(lasts.reduce((prev, curr) => prev + unq64(curr.low_price_q64), 0n)),
          close_price_q64: q64(
            lasts.reduce((prev, curr) => prev + unq64(curr.close_price_q64), 0n)
          ),
          volume_base: lasts.reduce((prev, curr) => prev + curr.volume_base, 0n),
          volume_quote: lasts.reduce((prev, curr) => prev + curr.volume_quote, 0n),
          integrator_fees: lasts.reduce((prev, curr) => prev + curr.integrator_fees, 0n),
          pool_fees_base: lasts.reduce((prev, curr) => prev + curr.pool_fees_base, 0n),
          pool_fees_quote: lasts.reduce((prev, curr) => prev + curr.pool_fees_quote, 0n),
          n_swaps: lasts.reduce((prev, curr) => prev + curr.n_swaps, 0n),
          n_chat_messages: lasts.reduce((prev, curr) => prev + curr.n_chat_messages, 0n),
          starts_in_bonding_curve: lasts[0].starts_in_bonding_curve,
          ends_in_bonding_curve: lasts[factor].ends_in_bonding_curve,
          tvl_per_lp_coin_growth_q64: 0n,
        };
        eventsAll.push(periodicState);
      }
    }
  }

  for (const event of eventsAll) {
    await insertPeriodicState(event, account, eventType, sql);
  }
};

const concatEmoji = (a: Array<HexInput>) =>
  a.map((v) => Hex.fromHexInput(v).toStringWithoutPrefix()).join("");

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
      await EmojicoinDotFun.RegisterMarket.submit({
        ...defaultTx,
        registrant: action.data.account,
        emojis: action.data.emojis,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "swap") {
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
      await EmojicoinDotFun.ProvideLiquidity.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        provider: action.data.account,
        quoteAmount: action.data.quoteAmount,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "removeLiquidity") {
      await EmojicoinDotFun.RemoveLiquidity.submit({
        ...defaultTxWithMarket(action.data.emojicoin),
        provider: action.data.account,
        lpCoinAmount: action.data.lpCoinAmount,
      })
        /* eslint-disable-next-line no-console */
        .catch(console.error);
    } else if (action.type === "chat") {
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

export const generateMockData = async (aptos: Aptos, publisher: Account) => {
  const registryAddress = await getRegistryAddress({
    aptos,
    moduleAddress: publisher.accountAddress,
  });

  // Create and fund accounts
  const accounts = [0, 1, 2, 3, 4, 5].map((_) => Account.generate());
  for (const account of accounts) {
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

  const sql = postgres({ username: "inbox", password: "inbox", db: "inbox" });

  const derivedNamedObjectAddress = deriveEmojicoinPublisherAddress({
    registryAddress,
    emojis: MOCK_DATA_MARKETS_EMOJIS[2],
  });

  const marketObjectMarketResource = await getMarketResource({
    aptos,
    moduleAddress: publisher.accountAddress,
    objectAddress: derivedNamedObjectAddress,
  });

  await generatePeriodicStates(
    emojicoins[2],
    concatEmoji(MOCK_DATA_MARKETS_EMOJIS[2]),
    marketObjectMarketResource.metadata.marketID,
    publisher.accountAddress.toString(),
    `${marketObjectMarketResource.metadata.marketAddress}::emojicoin_dot_fun::PeriodicState`,
    sql
  );
};
