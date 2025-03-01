import { useEffect, useState } from "react";

/**
 * A custom React hook that behaves like useState but persists the state in localStorage/sessionStorage.
 * Note: The "useLocalStorage" hook from "react-use" package doesn't provide the correct previous value
 * when setting state using a callback function. This hook fixes that issue.
 *
 * Warning: This shouldn't be used to share values between components. If two separate components
 * use the same key, updating one state will not update the other.
 *
 * @template T The type of the state value
 * @param {string} key The key under which the value will be stored in storage
 * @param {T} initialValue The initial value to use if no value exists in storage
 * @param {"localStorage" | "sessionStorage"} [storageType="localStorage"] The type of storage to use
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, () => void]} A tuple containing:
 *   - The current state value
 *   - A function to update the state
 *   - A function to clear the stored value
 */
function useStatePersisted<T>(
  key: string,
  initialValue: T,
  storageType: "localStorage" | "sessionStorage" = "localStorage"
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  // Function to get the value from local storage or return the initial value if not found
  const readValue = (): T => {
    // If server-side rendering, return initialValue directly
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window[storageType].getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  // State and setter for our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  const clear = () => {
    window[storageType].removeItem(key);
  };

  // Effect to persist changes to local storage
  useEffect(() => {
    if (typeof window == "undefined") {
      return;
    }

    try {
      window[storageType].setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue, storageType]);

  return [storedValue, setStoredValue, clear];
}

export default useStatePersisted;
