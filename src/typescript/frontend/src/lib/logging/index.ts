import "server-only";

// Type for functions with params
type AsyncFunctionWithParams<T, R> = (params: T) => Promise<R>;
// Type for functions without params
type AsyncFunctionNoParams<R> = () => Promise<R>;

/**
 * Overload for functions that take no parameters
 */
export function logFetch<R>(fn: AsyncFunctionNoParams<R>): Promise<R>;
/**
 * Overload for functions that take an object parameter
 */
export function logFetch<T extends object, R>(
  fn: AsyncFunctionWithParams<T, R>,
  params: T
): Promise<R>;
/**
 * Implementation handling both cases
 */
export async function logFetch<T extends object, R>(
  fn: AsyncFunctionNoParams<R> | AsyncFunctionWithParams<T, R>,
  params?: T
): Promise<R> {
  const fnName = fn.name || "anonymous";
  const start = performance.now();

  // Handle param logging for functions with parameters
  const paramsString = params
    ? Object.entries(params)
        .map(([key, value]) => {
          try {
            const serialized = JSON.stringify(value).slice(0, 30);
            return `${key}: ${serialized}${serialized.length > 29 ? "..." : ""}`;
          } catch {
            return `${key}: ${typeof value}`;
          }
        })
        .join(", ")
    : "";

  // Format the call signature based on whether params exist
  const callSignature = params ? `${fnName}({ ${paramsString} })` : `${fnName}()`;

  try {
    // Call function with or without params
    const result = await (params
      ? (fn as AsyncFunctionWithParams<T, R>)(params)
      : (fn as AsyncFunctionNoParams<R>)());
    const end = performance.now();
    /* eslint-disable-next-line no-console */
    console.log(`✓ ${callSignature} took ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`✗ ${callSignature} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
}
