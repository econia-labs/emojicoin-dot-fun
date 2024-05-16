import styled from "styled-components";

export const StyledContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  padding-left: 0;
  padding-right: 0;
  height: 100vh;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
`;
