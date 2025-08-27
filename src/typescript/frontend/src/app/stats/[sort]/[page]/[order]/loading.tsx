import Loading_ from "../../../loading";

/**
 * This must be here otherwise the [order] slug doesn't properly utilize the suspense boundary (and thus the loading
 * indicator doesn't work when switching the order from "desc" <=> "asc" for the same sort type).
 * @returns
 */
export default function Loading() {
  return <Loading_ />;
}
