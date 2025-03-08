type PathLeaf = "";
type PathNode = { [key: string]: PathNode | PathLeaf };

/**
 * Expand inner object paths recursively in the type to get proper autocomplete suggestions.
 */
type ExpandPaths<T extends PathNode, P extends string = ""> = {
  [K in Extract<keyof T, string>]: T[K] extends ""
    ? `${P}/${K}` // If it's a leaf, return the full path as a joined path string.
    : ExpandPaths<Extract<T[K], PathNode>, `${P}/${K}`>; // If it's an object, recurse.
};

// To satisfy the edge runtime, since it doesn't have access to the `node:path` function.
const pathJoinShim = (...args: string[]) => args.join("/");

/**
 * Helper function to expand nextjs route paths based on a simple router-like structured input.
 */
export const expandRoutes = <T extends PathNode>(obj: T, currPath: string = ""): ExpandPaths<T> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const newPath = pathJoinShim(currPath, key);
      if (value === "") {
        return [key, newPath];
      }
      return [key, expandRoutes(value, newPath)];
    })
  );
