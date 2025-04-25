import { DEFAULT_MAX_SLIPPAGE } from "const";
import { cn } from "lib/utils/class-name";
import React, { useEffect, useState } from "react";

import { InputNumeric } from "@/components/inputs/input-numeric";
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group";

import * as SlippageSettings from "../../../utils/slippage";

const toggleItemClassName =
  "text-2xl font-pixelar text-black cursor-pointer data-[state=on]:opacity-100 opacity-30 focus:outline-none";

export const TradeOptions = ({ onMaxSlippageUpdate }: { onMaxSlippageUpdate?: () => void }) => {
  const [maxSlippage, setMaxSlippage] = useState(DEFAULT_MAX_SLIPPAGE);
  const [maxSlippageMode, setMaxSlippageMode] = useState<SlippageSettings.MaxSlippageMode>("auto");
  useEffect(() => {
    const { mode, maxSlippage } = SlippageSettings.getMaxSlippageSettings();
    setMaxSlippage(maxSlippage);
    setMaxSlippageMode(mode);
  }, []);

  const handleModeChange = (mode: string) => {
    if (mode === "auto" || mode === "custom") {
      setMaxSlippageMode(mode);
      SlippageSettings.setMaxSlippageMode(mode);
      if (mode === "auto") {
        setMaxSlippage(SlippageSettings.getMaxSlippageSettings().maxSlippage);
      }
      onMaxSlippageUpdate?.();
    }
  };

  return (
    <div className="grid grid-rows-[auto_1px_auto] items-center max-h-[300px] border-r-4 overflow-auto bg-ec-blue">
      <div className="flex flex-row justify-between text-2xl text-black p-3">
        <span>Max Slippage</span>
        <span>{Number(maxSlippage) / 100}%</span>
      </div>
      <div className="border-b-2 border-dashed border-b-black" />
      <div className="flex flex-row p-3">
        <div className="flex justify-between gap-10">
          <ToggleGroup
            type="single"
            defaultValue="auto"
            value={maxSlippageMode}
            onValueChange={handleModeChange}
            className="flex flex-row justify-between m-auto gap-4"
            aria-label="Slippage settings"
          >
            <ToggleGroupItem
              value="auto"
              aria-label="automatically manage slippage settings"
              className={toggleItemClassName}
            >
              AUTO
            </ToggleGroupItem>
            <ToggleGroupItem
              value="custom"
              aria-label="set custom slippage settings"
              className={toggleItemClassName}
            >
              CUSTOM
            </ToggleGroupItem>
          </ToggleGroup>
          <div
            className={cn(
              "flex items-center border border-black border-solid rounded !leading-4",
              maxSlippageMode === "custom" ? "opacity-100" : "opacity-30",
              "text-2xl"
            )}
          >
            <InputNumeric
              disabled={maxSlippageMode !== "custom"}
              value={maxSlippage}
              onUserInput={(v) => {
                setMaxSlippage(v);
                SlippageSettings.setMaxSlippage(v);
                onMaxSlippageUpdate?.();
              }}
              decimals={2}
              className="w-[4rem] bg-transparent text-right outline-none"
            />
            <span className="ml-[1px] mr-[2px] block">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
