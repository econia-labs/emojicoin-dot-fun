"use client";
import { type SymbolEmojiData } from "@sdk/emoji_data";
import { StyledImage } from "components/image/styled";
import { EmojiMarketPageLinkV2 } from "components/pages/home/components/table-card/LinkOrAnimationTriggerV2";
import Link from "next/link";
import { ROUTES } from "router/routes";

interface CoinCardProps {
  id: number;
  title?: string;
  time: number;
  value: bigint;
  change: string;
  description?: string;
  emojis: Array<SymbolEmojiData>;
  imageURL?: string;
  titleSlug: string;
}

const formatTimeAgo = (timestamp: number): string => {
  try {
    const now = Date.now();
    const diff = now - timestamp;

    // Convert to different units
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `${years} y`;
    } else if (days > 0) {
      return `${days} d`;
    } else if (hours > 0) {
      return `${hours} hr`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return "1 min";
    }
  } catch (error) {
    console.error("Error formatting time ago:", error);
    return "Invalid timestamp";
  }
};

const formatValue = (value: bigint): string => {
  if (value >= 1_000_000_000) {
    return `${(Number(value) / 1_000_000_000).toFixed(2)}B APT`;
  } else if (value >= 1_000_000) {
    return `${(Number(value) / 1_000_000).toFixed(2)}M APT`;
  } else if (value >= 1_000) {
    return `${(Number(value) / 1_000).toFixed(2)}K APT`;
  } else if (value >= 1) {
    return value.toString() + " APT";
  } else {
    // For numbers less than 1, show up to 4 significant digits
    return value.toString() + " APT";
  }
};

const CoinCard: React.FC<CoinCardProps> = ({
  emojis,
  id,
  title,
  time,
  value,
  change,
  description,
  imageURL,
  titleSlug,
}) => {
  const timeAgo = formatTimeAgo(time);
  const formattedValue = formatValue(value ?? 0n);

  return (
    <Link href={`${ROUTES.coin}/${titleSlug}`}>
      <div className="box-show cursor-pointer px-5 mt-12 py-5 flex-box items-center rounded-full round w-full">
        <div className="flex items-center mr-5 sm-mb">
          <StyledImage
            className="box-img"
            src={imageURL ?? "/images/home/box-cir.png"}
            style={{
              // ...(imageURL && {
              //   clipPath: "circle(45%)",
              // }),
            }}
            width={150}
            height={150}
          />
        </div>
        <div className="w50-box">
          <div className="flex mb-5">
            <div className="mr-3" style={{ width: "20px" }}>
              <StyledImage src="/images/home/fire.png" />
            </div>
            <div className="font-medium flex items-center justify-center text-sm px-2 py-0 border-green text-green rounded-full mr-3">
              {change}
            </div>
          </div>
          <h1 className="mb-3 main-title-sm text-white dark:text-white">{title ?? "-"}</h1>
          <p className="text-white text-sm w50-box font-light">
            {description ?? "No description available"}
          </p>
        </div>
        <div style={{ marginRight: "8rem", marginLeft: "4rem" }}>
          <h5 className="mb-3 main-title-sm-2 text-white dark:text-white">{timeAgo}</h5>
        </div>
        <div>
          <h5 className="mb-3 main-title-sm-2 text-white dark:text-white">{formattedValue}</h5>
        </div>
      </div>
    </Link>
  );
};

export default CoinCard;
