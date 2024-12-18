import { type AnyNumberString } from "@sdk-types";
import { toExplorerLink } from "lib/utils/explorer-link";
import { EXTERNAL_LINK_PROPS } from "../link/const";

export const ExplorerLink = ({
  value,
  type,
  network,
  children,
  style,
  className,
}: {
  value: AnyNumberString;
  type: "acc" | "account" | "transaction" | "version" | "txn" | "coin";
  children: React.ReactNode;
  network?: string;
  style?: React.CSSProperties;
  className?: string;
}) => {
  const href = toExplorerLink({ value, linkType: type, network });
  return (
    <a
      style={style}
      className={className + " explorer-link"}
      href={href}
      {...EXTERNAL_LINK_PROPS}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
