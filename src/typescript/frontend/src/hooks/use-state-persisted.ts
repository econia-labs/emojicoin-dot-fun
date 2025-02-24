import { useEffect, useState } from "react";

// hook "useLocalStorage" from package "react-use" doesn't seem to provide the correct previous value when you set a state by using a callback function.
// This custom hook behaves exactly like useState from React, but it persists the state in the local/session storage.
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
