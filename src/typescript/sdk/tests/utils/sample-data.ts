import { type Types } from "../../src/types/types";

export const SAMPLE_SWAP_EVENT: Types.SwapEvent = {
  marketID: 1n,
  time: 0n,
  marketNonce: 0n,
  swapper: "0x0",
  inputAmount: 0n,
  isSell: false,
  integrator: "0x0",
  integratorFeeRateBPs: 0,
  netProceeds: 0n,
  baseVolume: 0n,
  quoteVolume: 0n,
  avgExecutionPrice: 0n,
  integratorFee: 0n,
  poolFee: 0n,
  startsInBondingCurve: false,
  resultsInStateTransition: false,
  guid: `Swap::${1n.toString()}::${10n.toString()}`,
  version: 0,
};

export const SAMPLE_STATE_EVENT: Types.StateEvent = {
  marketID: 1n,
  marketMetadata: {
    marketAddress: "0x0",
    marketID: 1n,
    emojiBytes: new Uint8Array([0x00, 0x01]),
  },
  stateMetadata: {
    marketNonce: 0n,
    bumpTime: 123n,
    trigger: 3,
  },
  clammVirtualReserves: {
    base: 0n,
    quote: 0n,
  },
  cpammRealReserves: {
    base: 0n,
    quote: 0n,
  },
  lpCoinSupply: 0n,
  cumulativeStats: {
    baseVolume: 0n,
    quoteVolume: 0n,
    integratorFees: 0n,
    poolFeesBase: 0n,
    poolFeesQuote: 0n,
    numSwaps: 1n,
    numChatMessages: 0n,
  },
  instantaneousStats: {
    totalQuoteLocked: 0n,
    totalValueLocked: 0n,
    marketCap: 0n,
    fullyDilutedValue: 0n,
  },
  lastSwap: {
    isSell: false,
    avgExecutionPrice: 0n,
    baseVolume: 0n,
    quoteVolume: 0n,
    nonce: 11n,
    time: 0n,
  },
  guid: `State::${1n.toString()}::${11n.toString()}`,
  version: 0,
};
