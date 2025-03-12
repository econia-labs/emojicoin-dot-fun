import Button from "components/button";
import { type FC, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import Text from "components/text";
import { cn } from "lib/utils/class-name";

interface Props {
  className?: string;
  endOfListText?: string;
  query?: {
    hasNextPage?: boolean;
    fetchNextPage: () => void;
    isLoading: boolean;
    isFetching: boolean;
  };
}

export const LoadMore: FC<Props> = ({ query, className, endOfListText }) => {
  const { ref, inView } = useInView();
  const [wasOutOfView, setWasOutOfView] = useState(false);

  // Prevents a double fetch. Has to get out of view before fetching next page again.
  useEffect(() => {
    setWasOutOfView(!inView);
  }, [inView]);

  useEffect(() => {
    if (query?.hasNextPage && wasOutOfView && inView && !query?.isLoading && !query?.isFetching) {
      query?.fetchNextPage();
    }
  }, [inView, query, wasOutOfView]);

  return (
    <div ref={ref} className={cn("flex justify-center items-center w-full", className)}>
      {query?.hasNextPage ? (
        /* Normally this button will never be visible. It is there as a fallback in case react-intersection-observer fails to detect the end of the table, or if the get request fails */
        <Button
          isLoading={query.isLoading || query.isFetching}
          onClick={() => query.fetchNextPage()}
        >
          Load More
        </Button>
      ) : (
        <Text color="lightGray">{endOfListText || "You've reached the end"}</Text>
      )}
    </div>
  );
};
