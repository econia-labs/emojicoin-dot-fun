import React from "react";
// Styling
import { StyledLink, RouterLink } from "./styled";
// Helpers
import { getExternalLinkProps } from "components/button";
// Types
import { LinkProps } from "./types";

const Link: React.FC<LinkProps> = ({ external, reloadDocument, href, underline, ...props }) => {
  const internalProps = external ? getExternalLinkProps() : {};
  const ariaLabel = props.children && typeof props.children === "string" ? props.children : href || "link";

  if (external) {
    return <StyledLink as="a" href={href} {...internalProps} underline={underline} {...props} aria-label={ariaLabel} />;
  } else {
    return (
      <RouterLink
        to={href || ".."}
        reloadDocument={reloadDocument}
        aria-label={ariaLabel}
        underline={underline ? underline.toString() : undefined}
      >
        <StyledLink as="span" {...internalProps} {...props} />
      </RouterLink>
    );
  }
};

Link.defaultProps = {
  underline: false,
};

export default Link;
