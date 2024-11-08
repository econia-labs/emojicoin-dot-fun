import { useQuery } from "@tanstack/react-query";
import { isUserGeoblockedServerAction } from "utils/server/geoblocked";

const useIsUserGeoblocked = () => {
  const { data } = useQuery({
    queryKey: ["geoblocked"],
    queryFn: () => isUserGeoblockedServerAction(),
    staleTime: Infinity,
  });

  // Assume the user is geoblocked if the response hasn't completed yet.
  return data ?? true;
};

export default useIsUserGeoblocked;
