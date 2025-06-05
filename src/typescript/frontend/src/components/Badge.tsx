import { darkColors } from "theme";
import type { Colors } from "theme/types";

export const Badge = ({
  color,
  children,
}: {
  color: keyof Colors;
} & React.PropsWithChildren) => {
  return (
    <div
      style={{
        border: `1px solid ${darkColors[color]}`,
        borderRadius: "8px",
        color: darkColors[color],
      }}
      className="h-min px-[.4rem] pixel-heading-4"
    >
      {children}
    </div>
  );
};
