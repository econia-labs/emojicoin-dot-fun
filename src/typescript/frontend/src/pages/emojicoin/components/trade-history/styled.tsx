import styled from "styled-components";
import { space, typography, layout, TypographyProps, SpaceProps, LayoutProps } from "styled-system";

import { Text } from "components";

interface TdProps extends TypographyProps, SpaceProps, LayoutProps {}

export const Table = styled.table`
  width: 100%;
  ${space}
`;

export const Th = styled(Text).attrs({ as: "th", textScale: "bodyLarge" })<TdProps>`
  color: ${({ theme }) => theme.colors.econiaBlue};
  padding: 12px;
  text-align: start;
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.colors.black};
  z-index: 1;
  text-transform: uppercase;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &:nth-child(1) {
    padding-inline-start: 24px;

    &:after {
      inset-inline-start: 24px;
    }
  }

  &:nth-last-child(1) {
    padding-inline-end: 24px;
    text-align: end;

    &:after {
      inset-inline-end: 24px;
    }
  }

  ${typography}
  ${space}
`;

export const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &:last-child {
    border-bottom: none;
  }

  ${layout}
`;

export const Td = styled.td<TdProps>`
  color: ${({ theme }) => theme.colors.lightGrey};
  padding: 12px;
  vertical-align: middle;
  position: relative;

  &:nth-child(1) {
    padding-inline-start: 24px;

    &:after {
      inset-inline-start: 24px;
    }
  }

  &:nth-last-child(1) {
    padding-inline-end: 24px;

    &:after {
      inset-inline-end: 24px;
    }
  }

  ${typography}
  ${space}
    ${layout}
`;

export const StyledTradeHistory = styled.div`
  width: 100%;
  height: 100%;
  max-height: 342px;
  overflow: auto;
`;

export const TBody = styled.tbody``;

export const THead = styled.thead``;
