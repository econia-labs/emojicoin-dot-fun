import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import {
  createContext,
  type DependencyList,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useUserSettings } from "./event-store-context";
import { toast } from "react-toastify";

type HotkeyMode = "*" | "cmd" | "goto" | null;

export const HotkeysContext = createContext<{
  mode: HotkeyMode;
  setMode: (mode: HotkeyMode) => void;
} | null>(null);

export const useHotkey = (
  key: string,
  mode: HotkeyMode,
  action: () => void,
  ops: {
    modifiers?: {
      ctrl?: boolean;
      shift?: boolean;
      alt?: boolean;
    };
    exitMode?: HotkeyMode;
  },
  ...deps: DependencyList
) => {
  const devMode = useUserSettings((s) => s.devMode);
  const context = useContext(HotkeysContext);
  if (context === null) {
    throw new Error("useHotkey must be used within a HotkeysContext.");
  }
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (devMode) {
        if (e.key === key) {
          if (ops.modifiers?.ctrl && !e.ctrlKey) return;
          if (ops.modifiers?.shift && !e.shiftKey) return;
          if (ops.modifiers?.alt && !e.altKey) return;
          if (mode !== "*" && mode !== context.mode) return;
          e.preventDefault();
          action();
          context.setMode(ops.exitMode ?? null);
        }
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [devMode, key, ops, mode, action, context, ...deps]);
};

const DefaultHotkeys = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  useHotkey("p", null, () => {}, { modifiers: { ctrl: true }, exitMode: "cmd" }, [router]);
  useHotkey("g", null, () => {}, { modifiers: { ctrl: true }, exitMode: "goto" }, [router]);
  useHotkey("Escape", "*", () => {}, { exitMode: null }, [router]);
  useHotkey("h", "goto", () => router.push(ROUTES.home), {}, [router]);
  useHotkey("p", "goto", () => router.push(ROUTES.pools), {}, [router]);
  useHotkey("l", "goto", () => router.push(ROUTES.launch), {}, [router]);
  useHotkey("c", "goto", () => router.push(ROUTES.cult), {}, [router]);

  return children;
};

export function HotkeysContextProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<HotkeyMode>(null);
  const [devModeCount, setDevModeCount] = useState(0);
  const toggleDevMode = useUserSettings((s) => s.toggleDevMode);
  const devMode = useUserSettings((s) => s.devMode);
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    const fn = (e: KeyboardEvent) => {
      if (e.key === "d" && e.ctrlKey) {
        e.preventDefault();
        setDevModeCount((v) => v + 1);
        const timeout = setTimeout(() => {
          setDevModeCount((v) => Math.min(0, v - 1));
          timeouts = timeouts.slice(1);
        }, 1300);
        timeouts.push(timeout);
      }
    };
    document.addEventListener("keydown", fn);
    return () => {
      document.removeEventListener("keydown", fn);
      timeouts.forEach(clearTimeout);
      timeouts = [];
    };
  }, []);
  useEffect(() => {
    if (devModeCount > 10) {
      toggleDevMode();
      setDevModeCount(0);
      if (devMode) {
        toast("Dev mode disabled");
      } else {
        toast("Dev mode enabled");
      }
    }
  }, [devModeCount, setDevModeCount, devMode, toggleDevMode]);

  return (
    <HotkeysContext.Provider value={{ mode, setMode }}>
      <DefaultHotkeys>{children}</DefaultHotkeys>
    </HotkeysContext.Provider>
  );
}

export default HotkeysContextProvider;
