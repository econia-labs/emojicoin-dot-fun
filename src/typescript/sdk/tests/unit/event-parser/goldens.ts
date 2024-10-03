// cspell:word goldens
import { rawTriggerToEnum, toAccountAddressString, toTrigger, Types } from "../../../src";

const Swap: Types["SwapEvent"] = {
  marketID: 26n,
  time: 1727851314936821n,
  avgExecutionPriceQ64: 172562593773750n,
  baseVolume: 10582986864996n,
  integratorFee: 1000000n,
  marketNonce: 92n,
  swapper: toAccountAddressString(
    "0xbad225596d685895aa64d92f4f0e14d2f9d8075d3b8adf1e90ae6037f1fcbabe"
  ),
  inputAmount: 100000000n,
  isSell: false,
  integrator: toAccountAddressString(
    "0x33332c9ea4c220e0572b7f83f397164f8171e1c9f681136bb8ab78efa6c43333"
  ),
  integratorFeeRateBPs: 100,
  netProceeds: 10582986864996n,
  poolFee: 0n,
  quoteVolume: 99000000n,
  resultsInStateTransition: false,
  startsInBondingCurve: true,
  balanceAsFractionOfCirculatingSupplyAfterQ64: 18446744073709551616n,
  balanceAsFractionOfCirculatingSupplyBeforeQ64: 18446744073709551616n,
  version: 123987,
  guid: `Swap::${26n}::${92n}`,
};

const State: Types["StateEvent"] = {
  version: 123987,
  marketID: 26n,
  marketMetadata: {
    marketAddress: toAccountAddressString(
      "0x3482d7ec914c86e9e898d40bf88a5d31afb3fb43ce73b3d58f0b888c70f7356f"
    ),
    emojiBytes: new Uint8Array([0xf0, 0x9f, 0x98, 0x80]),
    marketID: 26n,
  },
  stateMetadata: {
    bumpTime: 1727851314936821n,
    marketNonce: 92n,
    trigger: rawTriggerToEnum(2),
  },
  clammVirtualReserves: {
    base: 4572066261370141n,
    quote: 42869020000n,
  },
  cpammRealReserves: {
    base: 0n,
    quote: 0n,
  },
  cumulativeStats: {
    baseVolume: 327933738629859n,
    integratorFees: 128980000n,
    numChatMessages: 1n,
    numSwaps: 90n,
    poolFeesBase: 0n,
    poolFeesQuote: 0n,
    quoteVolume: 2869020000n,
  },
  lastSwap: {
    avgExecutionPriceQ64: 172562593773750n,
    baseVolume: 10582986864996n,
    isSell: false,
    nonce: 92n,
    quoteVolume: 99000000n,
    time: 1727851314936821n,
  },
  lpCoinSupply: 0n,
  instantaneousStats: {
    fullyDilutedValue: 42193305821n,
    marketCap: 3074801894n,
    totalQuoteLocked: 2869020000n,
    totalValueLocked: 41987523927n,
  },
  guid: `State::${26}::${92}`,
};

const PeriodicState: Types["PeriodicStateEvent"] = {
  version: 123987,
  marketID: 328n,
  closePriceQ64: 1128118906863219n,
  endsInBondingCurve: false,
  highPriceQ64: 1128118906863219n,
  integratorFees: 1000000n,
  lowPriceQ64: 1128118906863219n,
  marketMetadata: {
    emojiBytes: new Uint8Array([0xf0, 0x9f, 0x9f, 0xa5]),
    marketAddress: toAccountAddressString(
      "0x175394d0883e28262c4c40cb8228e47a36e6a813d5117805c3c26a5c"
    ),
    marketID: 328n,
  },
  numChatMessages: 0n,
  numSwaps: 1n,
  openPriceQ64: 1128118906863219n,
  periodicStateMetadata: {
    emitMarketNonce: 40278n,
    emitTime: 1723246374791035n,
    period: 60000000n,
    startTime: 1722900360000000n,
    trigger: rawTriggerToEnum(4),
  },
  poolFeesBase: 4057206788n,
  poolFeesQuote: 0n,
  startsInBondingCurve: false,
  tvlPerLPCoinGrowthQ64: 18447524036544063189n,
  volumeBase: 1618825508718n,
  volumeQuote: 99000000n,
  guid: `PeriodicState::${328}::${60000000}::${40278}`,
};

const Liquidity: Types["LiquidityEvent"] = {
  version: 123987,
  baseAmount: 1639206334780n,
  liquidityProvided: true,
  lpCoinAmount: 4272180527n,
  marketID: 328n,
  marketNonce: 40278n,
  baseDonationClaimAmount: 0n,
  quoteDonationClaimAmount: 0n,
  provider: toAccountAddressString(
    "0x000006d68589500aa64d92f4f0e14d2f9d8075d003b8adf1e90ae6037f100000"
  ),
  quoteAmount: 100000000n,
  time: 1723246374791035n,
  guid: `Liquidity::${328}::${40278}`,
};

const MarketRegistration: Types["MarketRegistrationEvent"] = {
  version: 123987,
  marketID: 2304n,
  marketMetadata: {
    emojiBytes: new Uint8Array([0xf0, 0x9f, 0x98, 0x8d, 0xf0, 0x9f, 0x98, 0x9c]),
    marketAddress: toAccountAddressString(
      "0xd3cbef2c5d489228ae5304f39d94bd794847b5c0e9d7968ab0391999926d3679"
    ),
    marketID: 2304n,
  },
  time: 1723253654764692n,
  registrant: toAccountAddressString(
    "0xbad225596d685895aa64d92f4f0e14d2f9d8075d3b8adf1e90ae6037f1fcbabe"
  ),
  integrator: toAccountAddressString(
    "0xd00db145c047cd3619ecba69e45b4ad77f43737d309d8113d6c1c35f7a8dd00d"
  ),
  integratorFee: 100000000n,
  guid: `MarketRegistration::${2304}`,
};

const GlobalState: Types["GlobalStateEvent"] = {
  version: 123987,
  cumulativeChatMessages: 16891n,
  cumulativeIntegratorFees: 249444000000n,
  cumulativeQuoteVolume: 200576291031n,
  cumulativeSwaps: 14209n,
  emitTime: 1723350357240102n,
  fullyDilutedValue: 912838434139348n,
  marketCap: 213923864245n,
  registryNonce: 33586n,
  totalQuoteLocked: 165704422193n,
  totalValueLocked: 5075928984264n,
  trigger: rawTriggerToEnum(1),
  guid: `GlobalState::${33586}`,
};

const Chat: Types["ChatEvent"] = {
  marketID: 26n,
  version: 123987,
  balanceAsFractionOfCirculatingSupplyQ64: 18446744073709551616n,
  circulatingSupply: 90233622131978n,
  emitMarketNonce: 31n,
  emitTime: 1727840694100792n,
  marketMetadata: {
    emojiBytes: new Uint8Array([0xf0, 0x9f, 0x98, 0x80]),
    marketAddress: toAccountAddressString(
      "0x3482d7ec914c86e9e898d40bf88a5d31afb3fb43ce73b3d58f0b888c70f7356f"
    ),
    marketID: 26n,
  },
  message: "🥲",
  user: toAccountAddressString(
    "0xbad225596d685895aa64d92f4f0e14d2f9d8075d3b8adf1e90ae6037f1fcbabe"
  ),
  userEmojicoinBalance: 90233622131978n,
  guid: `Chat::${26}::${31}`,
};

const goldens = { Swap, State, PeriodicState, Liquidity, MarketRegistration, GlobalState, Chat };
export default goldens;
