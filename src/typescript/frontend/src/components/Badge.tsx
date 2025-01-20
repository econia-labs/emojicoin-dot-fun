import { useThemeContext } from "context";
import type { Colors } from "theme/types";

export const Badge: React.FC<React.PropsWithChildren<{ color: keyof Colors }>> = ({
  children,
  color,
}) => {
  const { theme } = useThemeContext();

  return (
    <div
      style={{
        border: `1px solid ${theme.colors[color]}`,
        borderRadius: "8px",
        color: theme.colors[color],
      }}
      className="pixel-heading-4 px-[.4rem] h-min h-min"
    >
      {children}
    </div>
  );
};
