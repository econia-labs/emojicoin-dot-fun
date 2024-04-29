import { Image, Flex, Column } from "components";

export default {
  title: "Assets/Images",
};

// TODO this images are test so ypu can delete them
const context = require.context("../../../public/images/", true, /.webp$/);

export const Images = () => {
  return (
    <Column>
      {context.keys().map((el, i) => {
        const img = el.replace("./", "");

        return (
          <Flex key={i} m="8px" justifyContent="center" width="100%">
            <Image
              src={`/images/${img}`}
              width={{ _: "200px", tablet: "500px" }}
              aspectRatio={{ _: 0.8733, tablet: 0.8 }}
            />
          </Flex>
        );
      })}
    </Column>
  );
};
