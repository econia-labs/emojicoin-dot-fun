"use client";

import EmojiPickerWithInput from "@/components/emoji-picker/EmojiPickerWithInput";
import { Input } from "@/components/ui/Input";
import { type SymbolEmoji } from "@sdk/emoji_data";
import { getMarketAddress } from "@sdk/emojicoin_dot_fun";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useCallback, useMemo, useState } from "react";
import { useEffectOnce } from "react-use";
import { cn } from "lib/utils/class-name";
import { useFetchSymbol } from "./use-market-address-view";
import { Label } from "@/components/ui/Label";
import { ROUTES } from "router/routes";
import { Emoji } from "utils/emoji";

const addressTextClass = cn(
  "font-forma w-[66ch] text-center border border-solid border-light-gray",
  "radii-xs relative text-left p-2"
);

export const MarketAddressConversionForm = () => {
  const [queryAddress, setQueryAddress] = useState("");
  const emojis = useEmojiPicker((s) => s.emojis);
  const setMode = useEmojiPicker((s) => s.setMode);
  const fetchedSymbolEmojis = useFetchSymbol({ addressIn: queryAddress });
  const fetchedSymbol = useMemo(() => fetchedSymbolEmojis?.join("") ?? "", [fetchedSymbolEmojis]);
  useEffectOnce(() => setMode("register"));

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryAddress(e.target.value);
  }, []);

  return (
    <div className="flex flex-col relative m-auto w-fit gap-10 text-white text-sm font-forma">
      <div className="flex flex-col gap-1">
        <Label htmlFor="address-input">{"check if registered market"}</Label>
        <Input
          id="address-input"
          value={queryAddress}
          onChange={handleAddressChange}
          className={addressTextClass}
        />
        <div className="flex h-[2em] text-[1em] w-[18ch] border border-solid border-light-gray">
          {fetchedSymbol && (
            <a href={`${ROUTES.market}/${fetchedSymbol}`} className="p-[2px] mt-[1px] ml-1">
              <Emoji emojis={fetchedSymbol} />
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="emoji-picker-text-area">{"emojis => address"}</Label>
        <div className="w-[18ch] border border-solid border-light-gray">
          <EmojiPickerWithInput handleClick={async () => {}} />
        </div>
        <span className={addressTextClass}>
          {emojis.length ? getMarketAddress(emojis as SymbolEmoji[]).toString() : "0x"}
        </span>
      </div>
    </div>
  );
};
