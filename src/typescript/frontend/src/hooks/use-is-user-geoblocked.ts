import { useQuery } from "@tanstack/react-query";
import { isUserGeoblocked } from "utils/geolocation";

const useIsUserGeoblocked = () => {
  const { data } = useQuery({
    queryKey: ["geoblocked"],
    queryFn: () => isUserGeoblocked(),
    staleTime: Infinity,
  });

  // Assume the user is geoblocked if the response hasn't completed yet.
  return data ?? true;
};

export default useIsUserGeoblocked;
