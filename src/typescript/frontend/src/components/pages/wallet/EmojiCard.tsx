import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { type CoinData } from "app/wallet/[address]/page";
import { FormattedNumber } from "components/FormattedNumber";
import Text from "components/text";
import { toDisplayCoinDecimals } from "lib/utils/decimals";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useMemo, type FC } from "react";
import { Emoji } from "utils/emoji";
import { emojiNamesToPath } from "utils/pathname-helpers";

interface Props {
  coinData: CoinData;
}

export const EmojiCard: FC<Props> = ({ coinData }) => {
  const { emojiData, emojiName, amountDisplayString, emojiPath } = useMemo(() => {
    const emojiData = symbolBytesToEmojis(coinData.coin_info.symbol);
    const emojiName = emojisToName(emojiData.emojis);
    const amountDisplayString = toDisplayCoinDecimals({
      num: coinData.amount,
      decimals: coinData.coin_info?.decimals,
      round: 2,
    });
    const emojiPath = emojiNamesToPath(emojiData.emojis.map((x) => x.name));
    return { emojiData, emojiName, amountDisplayString, emojiPath };
  }, [coinData]);

  return (
    <a href={`/market/${emojiPath}`} className="p-4 border-[1px] border-solid border-dark-gray">
      <div className="flex flex-col">
        <Emoji
          className={`${coinData.coin_info.symbol.length <= 2 ? "text-[64px]" : "text-[52px]"} leading-[48px] text-center mb-[22px] text-nowrap`}
          emojis={coinData.coin_info.symbol}
        />
        <Text
          textScale="display5"
          textTransform="uppercase"
          $fontWeight="bold"
          mb="6px"
          ellipsis
          title={emojiName}
        >
          {emojiName}
        </Text>
        <div className="flex flex-row">
          <div>
            <div
              className={
                "body-sm font-forma text-light-gray " +
                "group-hover:text-ec-blue uppercase p-[1px] transition-all"
              }
            >
              Amount
            </div>
            <Text>
              <FormattedNumber
                suffix={` ${coinData.coin_info.symbol}`}
                value={amountDisplayString}
              />
            </Text>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <div>
          <div
            className={
              "body-sm font-forma text-light-gray " +
              "group-hover:text-ec-blue uppercase p-[1px] transition-all"
            }
          >
            Value
          </div>
          <Text>
            <FormattedNumber
              suffix={` ${coinData.coin_info.symbol}`}
              value={toDisplayCoinDecimals({
                num: coinData.amount,
                decimals: coinData.coin_info?.decimals,
                round: 2,
              })}
            />
          </Text>
        </div>
      </div>
    </a>
  );
};
