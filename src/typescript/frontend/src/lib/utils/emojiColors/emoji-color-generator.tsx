"use client";

import { useEmojiPicker } from "context/emoji-picker-context";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { notoColorEmoji } from "styles/fonts";

import Button from "@/components/button";
import SearchBar from "@/components/inputs/search-bar";
import AnimatedLoadingBoxes from "@/components/pages/launch-emojicoin/animated-loading-boxes";
import { CHAT_EMOJIS, SYMBOL_EMOJI_DATA, SYMBOL_EMOJIS } from "@/sdk/index";

import { getBooleanUserAgentSelectors } from "../user-agent-selectors";
import { getEmojiDominantColor, getGradientFromColors } from "./emoji-color-helpers";

export const EmojiColorGenerator = () => {
  const emojis = useEmojiPicker((s) => s.emojis);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isIOS, isMacOs } = useMemo(
    () => getBooleanUserAgentSelectors(window.navigator.userAgent),
    []
  );

  const [fontFamily, setFontFamily] = useState<"native" | "noto">(
    isIOS || isMacOs ? "native" : "noto"
  );
  const [emojiType, setEmojiType] = useState<"symbol" | "chat">("symbol");
  const [generatedColors, setGeneratedColors] = useState<Map<string, string>>();
  const [isLoading, setIsLoading] = useState(false);

  const colors = useMemo(() => {
    if (!emojis) return [];
    const colors = emojis.map((e) =>
      getEmojiDominantColor(
        e,
        fontFamily === "noto" ? notoColorEmoji.style.fontFamily : undefined,
        canvasRef.current || undefined
      )
    );
    return colors;
  }, [emojis, fontFamily]);

  const generate = async () => {
    setIsLoading(true);
    const colorsMap = new Map<string, string>();
    const allEmojis = Object.keys(emojiType === "symbol" ? SYMBOL_EMOJIS : CHAT_EMOJIS);
    for (const emoji of allEmojis) {
      const { hexString } = getEmojiDominantColor(
        emoji,
        fontFamily === "noto" ? notoColorEmoji.style.fontFamily : undefined
      );
      colorsMap.set(emoji, hexString);
      // This is required to prevent the browser from freezing/crashing during generation.
      await new Promise((r) => setTimeout(r, 1));
    }
    setGeneratedColors(colorsMap);
    setIsLoading(false);
  };

  const gradients = useMemo(
    () =>
      getGradientFromColors(
        emojis
          .filter(SYMBOL_EMOJI_DATA.hasEmoji)
          .map((v) => getEmojiDominantColor(v))
          .map((v) => v.hexString)
      ),
    [emojis]
  );

  return (
    <div className="flex flex-col items-center gap-y-3">
      {!isIOS && !isMacOs && (
        <h1 className="text-red pixel-heading-3">
          Must be on MacOs/IOS to test and generate colors for apple emojis
        </h1>
      )}
      <label className="pixel-heading-3">Select Font</label>
      <select
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value as "native" | "noto")}
        className="w-[200px] bg-black border border-white rounded h-[30px]"
      >
        <option value="native">Native</option>
        <option value={"noto"}>Noto</option>
      </select>
      <div className="flex flex-row justify-center gap-8">
        <div className="flex flex-col items-center gap-y-4">
          <h1 className="pixel-heading-3">Emoji color checker</h1>
          <SearchBar />
          <div className="flex flex-row items-center gap-2 min-h-[100px]">
            {colors.map((col, i) => {
              return (
                <div key={i}>
                  <div className="w-[50px] h-[50px]" style={{ backgroundColor: col.hexString }} />
                  <span>{col.hexString}</span>
                </div>
              );
            })}
          </div>
          <label className="pixel-heading-3b">Canvas</label>
          <canvas className="border-solid" ref={canvasRef} />
        </div>
        <div className="flex flex-col items-center gap-y-4">
          <h1 className="pixel-heading-3">Emoji color data generator</h1>
          <select
            value={emojiType}
            onChange={(e) => setEmojiType(e.target.value as "symbol" | "chat")}
            className="bg-black border border-white rounded h-[30px] w-[200px]"
          >
            <option value="symbol">Symbol Emojis</option>
            <option value="chat">Chat Emojis</option>
          </select>
          <div className="flex flex-row items-center gap-2">
            <Button disabled={isLoading} isLoading={isLoading} onClick={() => generate()}>
              Generate
            </Button>
            {generatedColors && (
              <Button
                disabled={isLoading}
                isLoading={isLoading}
                onClick={() => {
                  const colorsObject = Object.fromEntries(generatedColors.entries());
                  // Remove the # from the hex string to reduce size.
                  for (const [key, value] of Object.entries(colorsObject)) {
                    colorsObject[key] = value.replace("#", "");
                  }
                  navigator.clipboard.writeText(JSON.stringify(colorsObject));
                  toast.success("Copied to clipboard");
                }}
              >
                Copy to clipboard
              </Button>
            )}
          </div>
          {isLoading && <AnimatedLoadingBoxes />}
          <div className={"flex flex-row flex-wrap items-center gap-2"}>
            {generatedColors &&
              Array.from(generatedColors.entries()).map(([emoji, hexString]) => {
                return (
                  <div className="flex flex-row items-center gap-2 h-[50px] w-[100px]" key={emoji}>
                    <div className={fontFamily === "noto" ? notoColorEmoji.className : undefined}>
                      {emoji}
                    </div>
                    <div className="w-[20px] h-[20px]" style={{ backgroundColor: hexString }} />
                    <span>{hexString}</span>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2">
          <div className="flex flex-col items-center gap-y-4">
            <h1 className="pixel-heading-3">Emoji gradients</h1>
            <div className="flex flex-row items-center gap-2 min-h-[270px]">
              <div
                className="flex min-h-[270px] w-[200px]"
                style={{
                  backgroundImage: emojis.length > 1 ? gradients : undefined,
                  backgroundColor: emojis.length === 1 ? gradients : undefined,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
