import styled from "styled-components";
import { sliderAutoplay } from "./animations";
import { Text } from "components/text";

export const StyledSliderContainer = styled.div`
  width: 100%;
`;

export const StyledWrapper = styled.div`
  overflow: hidden;
  width: 100%;
`;

export const StyledInner = styled.div`
  display: flex;
  gap: 16px;
  animation: ${sliderAutoplay} 18s linear infinite;
`;

export const StyledItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  height: 40px;
  min-width: fit-content;
  gap: 16px;
`;

export const StyledText = styled(Text)`
  white-space: nowrap;
`;
