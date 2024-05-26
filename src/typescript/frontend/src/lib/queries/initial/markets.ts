import { SYMBOL_DATA } from "@/sdk/emoji_data/";
import { MarketView } from "@/sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { toCoinTypes } from "@/sdk/markets/utils";
import { type JSONTypes, toMarketView } from "@/sdk/types";
import { paginateMarketRegistrations } from "@/sdk/queries/market";
import { getAptos } from "@/sdk/utils/aptos-client";
import { APTOS_NETWORK } from "lib/env";

const getInitialMarketData = async () => {
  const { markets } = await paginateMarketRegistrations();
  const data = markets.map(m => ({
    marketID: m.marketMetadata.marketID,
    marketAddress: m.marketMetadata.marketAddress,
  }));

  const sliced = data.slice(0, 100).map(d => {
    const { emojicoin: t1, emojicoinLP: t2 } = toCoinTypes(d.marketAddress);
    return {
      ...d,
      emojicoin: t1,
      emojicoinLP: t2,
    };
  });

  const addresses = sliced.map(v => v.marketAddress);
  const t1 = sliced.map(v => v.emojicoin);
  const t2 = sliced.map(v => v.emojicoinLP);
  const aptos = getAptos(APTOS_NETWORK);

  const asyncResults: Array<Promise<JSONTypes.MarketView>> = [];

  // TODO: Replace with SQL query/view later.
  for (let i = 0; i < addresses.length; i += 1) {
    asyncResults.push(
      MarketView.view({
        aptos,
        marketAddress: addresses[i],
        typeTags: [t1[i], t2[i]],
      }),
    );
  }

  const marketViews = (await Promise.all(asyncResults)).map(v => ({
    emoji: SYMBOL_DATA.byHex(v.metadata.emoji_bytes)!,
    market: toMarketView(v),
    // TODO: Replace this with a real value later.
    volume24H: BigInt(Math.floor(Math.random() * 1337 ** 4)),
  }));

  // Sort by market cap.
  marketViews.sort((m1, m2) =>
    m2.market.instantaneousStats.marketCap < m1.market.instantaneousStats.marketCap
      ? -1
      : m2.market.instantaneousStats.marketCap > m1.market.instantaneousStats.marketCap
        ? 1
        : 0,
  );

  return marketViews;
};

export default getInitialMarketData;
