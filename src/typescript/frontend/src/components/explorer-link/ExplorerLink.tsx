import { toExplorerLink } from "lib/utils/explorer-link";

import type { AnyNumberString } from "@/sdk-types";

import { EXTERNAL_LINK_PROPS } from "../link/const";

export const ExplorerLink = ({
  value,
  type,
  network,
  children,
  style,
  title,
  className,
}: {
  value: AnyNumberString;
  type: "acc" | "account" | "transaction" | "version" | "txn" | "coin";
  children: React.ReactNode;
  network?: string;
  style?: React.CSSProperties;
  title?: string;
  className?: string;
}) => {
  const href = toExplorerLink({ value, linkType: type, network });
  return (
    <a
      style={style}
      className={className + " explorer-link"}
      href={href}
      title={title}
      {...EXTERNAL_LINK_PROPS}
    >
      {children}
    </a>
  );
};
