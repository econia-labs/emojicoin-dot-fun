import SpinnerIcon from "components/svg/icons/Spinner";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useGetFavoriteMarkets } from "lib/hooks/queries/use-get-favorites";
import { useFavoriteTransactionBuilder } from "lib/hooks/transaction-builders/use-favorite-builder";
import { cn } from "lib/utils/class-name";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";

import type { SymbolEmojiData } from "@/sdk/emoji_data/types";

import Popup from "../popup";

interface Props {
  marketAddress?: `0x${string}`;
  emojis?: SymbolEmojiData[];
  className?: string;
}

/**
 * A self-contained button that handles all the logic associated with adding and removing
 * a market from favorites.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.marketAddress] - The address of the market to favorite/unfavorite
 * @param {SymbolEmojiData[]} [props.emojis] - Array of emojis that can be used to derive a market address
 *                                             (used if marketAddress is not provided)
 * @param {string} [props.className] - CSS class name to apply to the heart icon
 *
 * @returns A heart icon button that toggles favorite status, or a spinner when loading
 */
export const FavoriteButton = ({ emojis, className }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const { submit, account } = useAptos();
  const {
    favoritesQuery: { refetch },
    checkIsFavorite,
  } = useGetFavoriteMarkets();

  const isFavorite = useMemo(() => checkIsFavorite(emojis), [checkIsFavorite, emojis]);

  const toggleFavorite = useFavoriteTransactionBuilder(emojis || [], !isFavorite);

  const handleClick = () => {
    setIsLoading(true);
    submit(toggleFavorite)
      .then(() => refetch())
      .finally(() => setIsLoading(false));
  };

  if (!account) {
    return null;
  }

  return isLoading ? (
    <SpinnerIcon className={className} />
  ) : (
    <Popup content={isFavorite ? "Remove from favorites" : "Add to favorites"}>
      <Heart
        className={cn(
          "cursor-pointer hover:text-ec-blue",
          isFavorite && "hover:fill-ec-blue",
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClick();
        }}
        fill={isFavorite ? "white" : undefined}
      />
    </Popup>
  );
};
