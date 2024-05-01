import React from "react";
import { Text } from "components";
import { scales } from "./types";

export default {
  title: "Components/Texts",
};

export const Texts = () => {
  return (
    <>
      {Object.values(scales).map(scale => {
        return (
          <div key={scale}>
            <Text textScale={scale}>{scale}</Text>
            <hr />
          </div>
        );
      })}

      <Text scale="body1" $fontWeight="bold">
        Custom Font weight
      </Text>
      <hr />

      <Text scale="body1" color="blue">
        Custom color
      </Text>
      <hr />

      <Text scale="body1" ellipsis width="100px">
        Ellipsis: a long Text with an ellipsis just for the example
      </Text>
      <hr />

      <Text scale="body1" textAlign="center">
        Align center
      </Text>
      <hr />

      <Text fontSize={{ _: "12px", tablet: "16px", laptop: "24px" }}>Size with media queries</Text>
      <hr />

      <Text textScale={{ _: "display2", tablet: "display1" }} as="span">
        Responsive Text Scale
      </Text>
      <hr />

      <Text $fontWeight={{ _: "regular", tablet: "bold" }}>Responsive fontWeight</Text>
      <hr />
    </>
  );
};
