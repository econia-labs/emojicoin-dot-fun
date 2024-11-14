const expect = <T>(v: T | undefined, message?: string): T => {
  if (typeof v === "undefined") {
    throw new Error(message ?? "Expected to receive a non-undefined value.");
  }
  return v;
};

const expectErrorMessage = (type: "event" | "model", eventType: string) =>
  `Expected to receive ${type === "event" ? "an event" : "a model"} of type ${eventType}`;

const Expect = {
  Register: {
    Event: expectErrorMessage("event", "MarketRegistrationEvent"),
    Model: expectErrorMessage("model", "MarketRegistrationEvent"),
  },
  Liquidity: {
    Event: expectErrorMessage("event", "LiquidityEvent"),
    Model: expectErrorMessage("model", "LiquidityEvent"),
  },
  Swap: {
    Event: expectErrorMessage("event", "SwapEvent"),
    Model: expectErrorMessage("model", "SwapEvent"),
  },
  Chat: {
    Event: expectErrorMessage("event", "ChatEvent"),
    Model: expectErrorMessage("model", "ChatEvent"),
  },
};

const customExpect = {
  expect,
  Expect,
};

export default customExpect;
