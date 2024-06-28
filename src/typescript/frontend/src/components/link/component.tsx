import React from "react";
import { StyledLink, RouterLink } from "./styled";
import { EXTERNAL_LINK_PROPS } from "./const";
import { type LinkProps } from "./types";
import { toExplorerLink } from "lib/utils/explorer-link";

export const ExplorerLink = ({
  value,
  type,
  network,
  children,
  style,
  className,
}: {
  value: string | number;
  type: "acc" | "account" | "transaction" | "version" | "txn";
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

const Link: React.FC<LinkProps> = ({ external, href, underline = false, target, ...props }) => {
  const internalProps = external ? EXTERNAL_LINK_PROPS : {};
  const ariaLabel =
    props.children && typeof props.children === "string" ? props.children : href || "link";

  if (external) {
    return (
      <StyledLink
        as="a"
        href={href}
        {...internalProps}
        underline={underline}
        {...props}
        aria-label={ariaLabel}
      />
    );
  } else {
    return (
      <RouterLink
        href={href || ".."}
        aria-label={ariaLabel}
        underline={underline ? underline.toString() : undefined}
        target={target}
      >
        <StyledLink as="span" {...internalProps} {...props} />
      </RouterLink>
    );
  }
};

export default Link;
