import Loading_ from "../../loading";

/**
 * This must be here otherwise the [order] slug doesn't properly utilize the suspense boundary for the page slug.
 */
export default function Loading() {
  return <Loading_ />;
}
