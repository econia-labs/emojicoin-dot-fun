import { useQuery } from "@tanstack/react-query";
import {
  LOCAL_STORAGE_CACHE_TIME,
  readLocalStorageCache,
  writeLocalStorageCache,
} from "configs/local-storage-keys";
import { isUserGeoblocked } from "utils/geolocation";

const FETCH_IS_GEOBLOCKED_CACHE_TIME = LOCAL_STORAGE_CACHE_TIME["geoblocking"];

const useIsUserGeoblocked = (args?: { explicitlyGeoblocked: boolean }) => {
  // In some cases we may want to know if the query's return value is explicitly true.
  const { explicitlyGeoblocked = false } = args ?? {};
  const { data } = useQuery({
    queryKey: ["geoblocked"],
    queryFn: async () => {
      let geoblocked = readLocalStorageCache<boolean>("geoblocking");

      if (geoblocked === null) {
        geoblocked = await isUserGeoblocked();
        writeLocalStorageCache("geoblocking", geoblocked);
      }

      return geoblocked;
    },
    staleTime: FETCH_IS_GEOBLOCKED_CACHE_TIME,
    placeholderData: (prev) => prev,
  });

  // If we want to know if they're explicitly geoblocked, return true only if `data === true`.
  // Otherwise, return true if they're explicitly geoblocked or if the query hasn't returned yet;
  // i.e., the data is undefined.
  return explicitlyGeoblocked ? data === true : (data ?? true);
};

export default useIsUserGeoblocked;
