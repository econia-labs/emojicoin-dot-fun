import SpinnerIcon from "components/svg/icons/Spinner";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useGetFavorites } from "lib/hooks/queries/use-get-favorites";
import { useFavoriteTransactionBuilder } from "lib/hooks/transaction-builders/use-favorite-builder";
import { cn } from "lib/utils/class-name";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";

import type { SymbolEmoji } from "@/sdk/index";
import { getMarketAddress } from "@/sdk/index";

import Popup from "../popup";

interface Props {
  marketAddress?: `0x${string}`;
  emojis?: SymbolEmoji[] | string[];
  className?: string;
}

/**
 * A self-contained button that handles all the logic associated with adding and removing
 * a market from favorites.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.marketAddress] - The address of the market to favorite/unfavorite
 * @param {string[] | SymbolEmoji[]} [props.emojis] - Array of emojis that can be used to derive a market address
 *                                    (used if marketAddress is not provided)
 * @param {string} [props.className] - CSS class name to apply to the heart icon
 *
 * @returns A heart icon button that toggles favorite status, or a spinner when loading
 */
export const FavoriteButton = ({ marketAddress, emojis, className }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const { submit } = useAptos();
  const {
    favoritesQuery: { refetch },
    checkIsFavorite,
  } = useGetFavorites();

  const mktAddress = useMemo(() => {
    if (marketAddress) {
      return marketAddress;
    } else if (emojis) {
      return getMarketAddress(emojis.map((e) => e)).toString();
    }
    console.error("No market address or emojis provided");
    return "0x0";
  }, [marketAddress, emojis]);

  const isFavorite = useMemo(() => {
    if (mktAddress) {
      return checkIsFavorite(mktAddress);
    }
    return false;
  }, [checkIsFavorite, mktAddress]);

  const toggleFavorite = useFavoriteTransactionBuilder(mktAddress, !isFavorite);

  const handleClick = () => {
    setIsLoading(true);
    submit(toggleFavorite)
      .then(() => refetch())
      .finally(() => setIsLoading(false));
  };

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
