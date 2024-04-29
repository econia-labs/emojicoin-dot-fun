import React, { useState } from "react";
// Components + styling
import { ResponsiveBox, Skeleton } from "components";
import { StyledImage } from "./styled";
// Utils
import { getFileNameFromSrc } from "utils";
// Types
import { ImageProps } from "./types";

const Image: React.FC<ImageProps> = ({ src, width, alt, variant, animation, aspectRatio, ...props }) => {
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
      />
    </ResponsiveBox>
  );
};

export default Image;
