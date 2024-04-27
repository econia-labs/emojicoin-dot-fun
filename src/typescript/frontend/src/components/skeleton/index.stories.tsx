import React from "react";
import { Skeleton, Text } from "components";

export default {
  title: "Components/Skeletons",
};

export const Skeletons: React.FC = () => {
  return (
    <>
      <Text>Pulse</Text>
      <Skeleton my="8px" />
      <Skeleton my="8px" width="100px" height="100px" variant="circle" />
      <Skeleton my="8px" width="100px" height="100px" />

      <Text>Waves</Text>
      <Skeleton my="8px" />
      <Skeleton my="8px" width="100px" height="100px" variant="circle" animation="waves" />
      <Skeleton my="8px" width="100px" height="100px" animation="waves" />
    </>
  );
};
