import React, { useEffect, useState } from "react";

import { DropdownMenuWrapper } from "../dropdown-menu/styled";

import { type TradeOptionsProps } from "../types";
import {
  DropdownMenuInner,
  StyledDropdownMenuClose,
  StyledDropdownMenuItem,
} from "../dropdown-menu//components/dropdown-menu-item/styled";
import { InputNumeric } from "components/inputs";
import { DEFAULT_MAX_SLIPPAGE } from "const";

import * as SlippageSettings from "../../../utils/slippage";

export const TradeOptions: React.FC<TradeOptionsProps> = ({ onClose, onMaxSlippageUpdate }) => {
  const [maxSlippage, setMaxSlippage] = useState<bigint>(DEFAULT_MAX_SLIPPAGE);
  const [maxSlippageMode, setMaxSlippageMode] = useState<SlippageSettings.MaxSlippageMode>("auto");
  useEffect(() => {
    const { mode, maxSlippage } = SlippageSettings.getMaxSlippageSettings();
    setMaxSlippage(maxSlippage);
    setMaxSlippageMode(mode);
  }, []);
  return (
    <DropdownMenuWrapper>
      <StyledDropdownMenuClose
        key="close"
        disabled={false}
        onClick={onClose}
        className="cursor-pointer"
      >
        <DropdownMenuInner
          className="flex"
          style={{ justifyContent: "end", margin: "0", padding: "0" }}
        >
          <div className="med-pixel-text lowercase">x</div>
        </DropdownMenuInner>
      </StyledDropdownMenuClose>
      <StyledDropdownMenuItem disabled={false}>
        <DropdownMenuInner>
          <div className="med-pixel-text flex flex-row justify-between gap-[16px] w-[100%]">
            <span className="text-black font-pixelar text-2xl">MAX. SLIPPAGE</span>
            <span className="text-black font-pixelar text-2xl">{Number(maxSlippage) / 100}%</span>
          </div>
        </DropdownMenuInner>
      </StyledDropdownMenuItem>
      <StyledDropdownMenuItem disabled={false}>
        <DropdownMenuInner>
          <div className="med-pixel-text flex flex-row justify-between gap-[32px]">
            <div className="mt-[3px] med-pixel-text flex flex-row justify-between gap-[16px]">
              <span
                className={`${maxSlippageMode === "auto" ? "text-black" : "text-dark-gray"} font-pixelar text-2xl cursor-pointer`}
                onClick={() => {
                  setMaxSlippageMode("auto");
                  SlippageSettings.setMaxSlippageMode("auto");
                  setMaxSlippage(SlippageSettings.getMaxSlippageSettings().maxSlippage);
                  if (onMaxSlippageUpdate) onMaxSlippageUpdate();
                }}
              >
                AUTO
              </span>
              <span
                className={`${maxSlippageMode === "custom" ? "text-black" : "text-dark-gray"} font-pixelar text-2xl cursor-pointer`}
                onClick={() => {
                  setMaxSlippageMode("custom");
                  SlippageSettings.setMaxSlippageMode("custom");
                  if (onMaxSlippageUpdate) onMaxSlippageUpdate();
                }}
              >
                CUSTOM
              </span>
            </div>
            <div
              className={`${maxSlippageMode === "custom" ? "text-black border-black" : "text-dark-gray border-dark-gray"} flex flex-row border-[1px] p-[.2rem] rounded border-solid`}
            >
              <InputNumeric
                disabled={maxSlippageMode === "auto"}
                value={maxSlippage}
                onUserInput={(v) => {
                  setMaxSlippage(v);
                  SlippageSettings.setMaxSlippage(v);
                  if (onMaxSlippageUpdate) onMaxSlippageUpdate();
                }}
                decimals={2}
                className="w-[4rem] bg-transparent text-right outline-none"
              />
              <span className="mt-[3px] block">%</span>
            </div>
          </div>
        </DropdownMenuInner>
      </StyledDropdownMenuItem>
    </DropdownMenuWrapper>
  );
};
