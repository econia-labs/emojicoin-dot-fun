import React from "react";
import { StyledLink, RouterLink } from "./styled";
import { EXTERNAL_LINK_PROPS } from "./const";
import { type LinkProps } from "./types";

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
