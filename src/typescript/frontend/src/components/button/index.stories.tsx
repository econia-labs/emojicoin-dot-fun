import React from "react";

import Button from "components/button";
import { Box, Row } from "@/containers";
import { variants, scales } from "./types";
import { CloseIcon } from "components/svg";

export default {
  title: "Components/Buttons",
};

export const Buttons: React.FC = () => {
  return (
    <>
      <Box mb="32px">
        {Object.values(variants).map(variant => {
          return (
            <Row alignItems="center" key={variant} mb="32px">
              {Object.values(scales).map((scale, i) => {
                return (
                  <Button
                    key={scale}
                    variant={variant}
                    scale={scale}
                    m="8px"
                    startIcon={i === 1 && <CloseIcon />}
                    endIcon={i === 2 && <CloseIcon />}
                  >
                    {`${variant} ${scale.toUpperCase()}`}
                  </Button>
                );
              })}
            </Row>
          );
        })}
      </Box>

      <Box mb="32px">
        {Object.values(variants).map(variant => {
          return (
            <Row alignItems="center" key={variant} mb="32px">
              {Object.values(scales).map(scale => {
                return (
                  <Button key={scale} variant={variant} scale={scale} m="8px" isLoading>
                    {`${variant} ${scale.toUpperCase()}`}
                  </Button>
                );
              })}
            </Row>
          );
        })}
      </Box>

      <Box mb="32px">
        {Object.values(variants).map(variant => {
          return (
            <Row alignItems="center" key={variant} mb="32px">
              {Object.values(scales).map((scale, i) => {
                return (
                  <Button
                    key={scale}
                    variant={variant}
                    scale={scale}
                    m="8px"
                    startIcon={i === 1 && <CloseIcon />}
                    endIcon={i === 2 && <CloseIcon />}
                    disabled
                  >
                    Disabled
                  </Button>
                );
              })}
            </Row>
          );
        })}
      </Box>

      <Box mb="32px">
        <Button as="a" href="https://google.com" external mx="8px">
          External
        </Button>
      </Box>
    </>
  );
};
