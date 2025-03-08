import Button from "components/button";
import { type FC, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { TableCell, TableRow } from "./table";
import Text from "components/text";

interface Props {
  colSpan?: number;
  query?: {
    hasNextPage?: boolean;
    fetchNextPage: () => void;
    isLoading: boolean;
    isFetching: boolean;
  };
}

export const LoadMore: FC<Props> = ({ colSpan, query }) => {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (query?.hasNextPage && inView && !query?.isLoading && !query?.isFetching) {
      query?.fetchNextPage();
    }
  }, [inView, query]);

  return (
    <TableRow ref={ref}>
      <TableCell colSpan={colSpan}>
        <div className="flex justify-center items-center w-full">
          {query?.hasNextPage ? (
            /* Normally this button will never be visible. It is there as a fallback in case react-intersection-observer fails to detect the end of the table, or if the get request fails */
            <Button
              isLoading={query.isLoading || query.isFetching}
              onClick={() => query.fetchNextPage()}
            >
              Load More
            </Button>
          ) : (
            <Text>End of list</Text>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
