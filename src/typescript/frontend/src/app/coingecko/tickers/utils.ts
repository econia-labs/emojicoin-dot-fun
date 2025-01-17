import { toReserves } from "@sdk-types";
import { type Uint64String } from "@sdk/emojicoin_dot_fun";
import { calculateCurvePrice, calculateRealReserves } from "@sdk/markets";
import Big from "big.js";
import { getAptPrice } from "lib/queries/get-apt-price";
import "server-only";

export const estimateLiquidityInUSD = async (e: {
  clamm_virtual_reserves_base: Uint64String;
  clamm_virtual_reserves_quote: Uint64String;
  cpamm_real_reserves_base: Uint64String;
  cpamm_real_reserves_quote: Uint64String;
  lp_coin_supply: Uint64String;
}) => {
  const aptPrice = Big((await getAptPrice()) ?? 0.0);
  const clammVirtualReserves = toReserves({
    base: e.clamm_virtual_reserves_base,
    quote: e.clamm_virtual_reserves_quote,
  });
  const cpammRealReserves = toReserves({
    base: e.cpamm_real_reserves_base,
    quote: e.cpamm_real_reserves_quote,
  });

  const lpCoinSupply = BigInt(e.lp_coin_supply);
  const priceRatio = calculateCurvePrice({
    clammVirtualReserves,
    cpammRealReserves,
    lpCoinSupply,
  });
  const reserves = calculateRealReserves({
    clammVirtualReserves,
    cpammRealReserves,
    lpCoinSupply,
  });
  const bigReserves = {
    base: Big(reserves.base.toString()),
    quote: Big(reserves.quote.toString()),
  };
  const totalAPTInReserves = bigReserves.quote.plus(bigReserves.base.mul(priceRatio));
  const totalUSDInReserves = totalAPTInReserves.mul(aptPrice);
  return totalUSDInReserves;
};
