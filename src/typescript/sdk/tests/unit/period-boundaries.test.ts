import { CandlestickResolution, getPeriodBoundary } from "../../src";
import { SAMPLE_STATE_EVENT, SAMPLE_SWAP_EVENT } from "../utils/sample-data";

const swap = SAMPLE_SWAP_EVENT;
const state = SAMPLE_STATE_EVENT;
const epoch = new Date(0);
const epochInMicroseconds = BigInt(epoch.getTime() * 1000);

const microsecondFactor = 10n ** 6n;

const { PERIOD_1M } = CandlestickResolution;
const { PERIOD_5M } = CandlestickResolution;
const { PERIOD_15M } = CandlestickResolution;
const { PERIOD_30M } = CandlestickResolution;
const { PERIOD_1H } = CandlestickResolution;
const { PERIOD_4H } = CandlestickResolution;
const { PERIOD_1D } = CandlestickResolution;

describe("tests period boundaries", () => {
  it("calculates the first period boundary ever correctly for a swap event", () => {
    swap.time = epochInMicroseconds;
    expect(getPeriodBoundary(swap, PERIOD_1D) === 0n * BigInt(PERIOD_1D)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_4H) === 0n * BigInt(PERIOD_4H)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_1H) === 0n * BigInt(PERIOD_1H)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
  });

  it("calculates the first period boundary ever correctly for a state event", () => {
    state.lastSwap.time = epochInMicroseconds;
    expect(getPeriodBoundary(state, PERIOD_1D) === 0n * BigInt(PERIOD_1D)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_4H) === 0n * BigInt(PERIOD_4H)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_1H) === 0n * BigInt(PERIOD_1H)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
  });

  it("calculates various period boundaries correctly for a swap event", () => {
    swap.time = epochInMicroseconds;
    // Exactly at the period boundary.
    swap.time += 60n * microsecondFactor;

    // Put it right before the next period boundary.
    swap.time -= 1n;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    swap.time += 1n;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    swap.time += 1n;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    swap.time += 60n * microsecondFactor;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 2n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 3 minutes.
    swap.time += 3n * 60n * microsecondFactor;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 5n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 1n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 10 minutes.
    swap.time += 10n * 60n * microsecondFactor;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 15n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 3n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_15M) === 1n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);

    // Subtract 1 second.
    swap.time -= 1n * microsecondFactor;
    expect(getPeriodBoundary(swap, PERIOD_1M) === 14n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_5M) === 2n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodBoundary(swap, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
  });

  it("calculates various period boundaries correctly for a state event", () => {
    state.lastSwap.time = epochInMicroseconds;
    // Exactly at the period boundary.
    state.lastSwap.time += 60n * microsecondFactor;

    // Put it right before the next period boundary.
    state.lastSwap.time -= 1n;
    expect(getPeriodBoundary(state, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    state.lastSwap.time += 1n;
    expect(getPeriodBoundary(state, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    state.lastSwap.time += 1n;
    expect(getPeriodBoundary(state, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    state.lastSwap.time += 60n * microsecondFactor;
    expect(getPeriodBoundary(state, PERIOD_1M) === 2n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 3 minutes.
    state.lastSwap.time += 3n * 60n * microsecondFactor;
    expect(getPeriodBoundary(state, PERIOD_1M) === 5n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 1n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 10 minutes.
    state.lastSwap.time += 10n * 60n * microsecondFactor;
    expect(getPeriodBoundary(state, PERIOD_1M) === 15n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 3n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_15M) === 1n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);

    // Subtract 1 second.
    state.lastSwap.time -= 1n * microsecondFactor;
    expect(getPeriodBoundary(state, PERIOD_1M) === 14n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_5M) === 2n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodBoundary(state, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
  });
});
