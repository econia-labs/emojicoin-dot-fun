import React from "react";

import { Flex, Text } from "components";

export default {
  title: "Components/Icons",
};

const context = require.context("components/svg", true, /.tsx$/);
const components: {
  [key: string]: typeof import("./Svg");
} = context.keys().reduce((accum, path) => {
  const file = path.substring(2).replace(".tsx", "");
  return {
    ...accum,
    [file]: context(path),
  };
}, {});

export const Icons: React.FC = () => {
  return (
    <Flex justifyContent="start" alignItems="center" flexWrap="wrap">
      {Object.keys(components).map(file => {
        const folderName = "icons/";
        if (file.startsWith(folderName)) {
          const Icon = components[file].default;
          const [_, iconName] = file.split(folderName);

          return (
            <Flex flexDirection="column" justifyContent="center" alignItems="center" m="8px" key={file}>
              <Icon width="48px" />
              <Text textAlign="center">{iconName}</Text>
            </Flex>
          );
        }
      })}
    </Flex>
  );
};
