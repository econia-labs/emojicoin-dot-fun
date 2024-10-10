// cspell:word testid
import store from "./StoreContext";

const { useStore } = store;

const displayCountAsText = (n: number) => `Count: ${n}`;
export const displayCountPattern = (n: number) => new RegExp(`^\\s*${displayCountAsText(n)}\\s*$`);

const Component = () => {
  const count = useStore((s) => s.count);
  const increment = useStore((s) => s.increment);
  return (
    <div>
      <span data-testid="count">{displayCountAsText(count)}</span>
      <button data-testid="button" onClick={increment}>
        Increment
      </button>
    </div>
  );
};

export default Component;
