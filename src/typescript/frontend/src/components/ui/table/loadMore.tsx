import Button from "components/button";
import { type FC, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { TableRow } from "./table";
import Text from "components/text";

interface Props {
  query?: {
    hasNextPage?: boolean;
    fetchNextPage: () => void;
    isLoading: boolean;
    isFetching: boolean;
  };
}

export const LoadMore: FC<Props> = ({ query }) => {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (query?.hasNextPage && inView && !query?.isLoading && !query?.isFetching) {
      query?.fetchNextPage();
    }
  }, [inView, query]);

  return (
    <TableRow className="relative" ref={ref}>
      <div className="absolute left-0 top-0 flex flex-row justify-center items-center w-full h-full">
        {query?.hasNextPage ? (
          /* Normally this button will never be visible. It is there as a fallback in case react-intersection-observer fails to detect the end of the table, or if the get request fails */
          <Button
            isLoading={query.isLoading || query.isFetching}
            onClick={() => query.fetchNextPage()}
          >
            Load More
          </Button>
        ) : (
          <Text className="">End of list</Text>
        )}
      </div>
    </TableRow>
  );
};
