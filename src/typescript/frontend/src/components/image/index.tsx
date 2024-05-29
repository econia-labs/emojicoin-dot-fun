"use client";

import React, { useState } from "react";
import Skeleton from "components/skeleton";
import { ResponsiveBox } from "components/layout/components/responsive-box";
import { StyledImage } from "./styled";
import { getFileNameFromSrc } from "utils";
import { type ImageProps } from "./types";

const Image: React.FC<ImageProps> = ({
  src,
  width,
  alt,
  variant,
  animation,
  aspectRatio,
  ...props
}) => {
  const [isLoading, setLoading] = useState(true);
  const altDescription = getFileNameFromSrc(src);

  return (
    <ResponsiveBox width={width} aspectRatio={aspectRatio} {...props}>
      {isLoading && <Skeleton variant={variant} animation={animation} width="100%" height="100%" />}
      <StyledImage
        style={{ display: !isLoading ? "block" : "none" }}
        src={src}
        variant={variant}
        alt={alt || altDescription}
        onLoad={() => {
          setLoading(false);
        }}
        className={props.className}
        id={props.id}
      />
    </ResponsiveBox>
  );
};

export default Image;
