import { DEFAULT_MAX_SLIPPAGE } from "../const";

export type MaxSlippageMode = "auto" | "custom";
const LOCALSTORAGE_MAX_SLIPPAGE_KEY = "maxSlippage";
const LOCALSTORAGE_MAX_SLIPPAGE_MODE_KEY = "maxSlippageMode";

export const setMaxSlippage = (value: bigint) => {
  if (value > 10000n || value < 0n) return;
  localStorage.setItem(LOCALSTORAGE_MAX_SLIPPAGE_KEY, value.toString());
};

export const setMaxSlippageMode = (mode: MaxSlippageMode) => {
  if (mode !== "auto" && mode !== "custom") return;
  localStorage.setItem(LOCALSTORAGE_MAX_SLIPPAGE_MODE_KEY, mode);
  if (mode === "auto") {
    setMaxSlippage(DEFAULT_MAX_SLIPPAGE);
  }
};

export const getMaxSlippageSettings = () => {
  if (typeof window === "undefined") {
    return {
      mode: "auto" as MaxSlippageMode,
      maxSlippage: DEFAULT_MAX_SLIPPAGE,
    };
  }

  let maxSlippageModeFromLocalStorage = localStorage.getItem(
    LOCALSTORAGE_MAX_SLIPPAGE_MODE_KEY
  ) as MaxSlippageMode;
  if (!maxSlippageModeFromLocalStorage) {
    setMaxSlippageMode("auto");
    maxSlippageModeFromLocalStorage = "auto";
  }
  if (maxSlippageModeFromLocalStorage === "auto") {
    return {
      mode: "auto" as MaxSlippageMode,
      maxSlippage: DEFAULT_MAX_SLIPPAGE,
    };
  } else {
    const maxSlippageFromLocalStorage = localStorage.getItem(LOCALSTORAGE_MAX_SLIPPAGE_KEY);
    return {
      mode: "custom" as MaxSlippageMode,
      maxSlippage: BigInt(maxSlippageFromLocalStorage ?? "500"),
    };
  }
};
