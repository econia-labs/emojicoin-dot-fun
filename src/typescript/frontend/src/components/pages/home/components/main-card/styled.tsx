import styled from "styled-components";
import { Text } from "components/text";
import Image from "components/image";

export const StyledDoubleEmoji = styled.div`
  position: absolute;
  left: 61%;
  transform: translateX(-50%);
  font-size: 50px;
  line-height: unset;
  padding-top: 8px;

  @media screen and (min-width: 578px) {
    font-size: 50px;
    padding-top: 14px;
  }

  @media screen and (min-width: 1096px) {
    font-size: 60px;
    padding-top: 18px;
  }

  @media screen and (min-width: 1355px) {
    font-size: 77px;
  }

  @media screen and (min-width: 1614px) {
    font-size: 92px;
  }

  @media screen and (min-width: 1873px) {
    font-size: 106px;
  }
`;

export const StyledEmoji = styled.div`
  position: absolute;
  left: 61%;
  transform: translateX(-50%);
  font-size: 51px;
  line-height: unset;
  padding-top: 8px;

  @media screen and (min-width: 578px) {
    font-size: 74px;
    padding-top: 14px;
  }

  @media screen and (min-width: 1096px) {
    font-size: 97px;
    padding-top: 18px;
  }

  @media screen and (min-width: 1355px) {
    font-size: 120px;
    padding-top: 32px;
  }

  @media screen and (min-width: 1614px) {
    font-size: 143px;
  }

  @media screen and (min-width: 1873px) {
    font-size: 166px;
  }
`;

export const StyledPixelHeadingText = styled(Text)`
  font-size: 26px;

  @media screen and (min-width: 578px) {
    font-size: 37px;
  }

  @media screen and (min-width: 1096px) {
    font-size: 49px;
  }

  @media screen and (min-width: 1355px) {
    font-size: 60px;
  }

  @media screen and (min-width: 1614px) {
    font-size: 72px;
  }

  @media screen and (min-width: 1873px) {
    font-size: 83px;
  }
`;

export const StyledDisplayFontText = styled(Text)`
  font-size: 38px;
  line-height: unset;
  font-family: ${({ theme }) => theme.fonts.formaM};
  margin-top: -12px;
  margin-bottom: 7px;
  max-width: 50vw;

  @media screen and (min-width: 578px) {
    font-size: 55px;
    margin-bottom: 5px;
    margin-top: -4px;
  }

  @media screen and (min-width: 1096px) {
    font-size: 72px;
    margin-bottom: 16px;
  }

  @media screen and (min-width: 1355px) {
    font-size: 89px;
    margin-top: 12px;
    margin-bottom: 24px;
  }

  @media screen and (min-width: 1614px) {
    font-size: 106px;
    margin-bottom: 10px;
  }

  @media screen and (min-width: 1873px) {
    font-size: 124px;
    margin-bottom: 8px;
  }
`;

export const StyledMarketDataText = styled(Text)`
  font-size: 11px;
  line-height: unset;
  margin-bottom: 7px;

  @media screen and (min-width: 578px) {
    font-size: 16px;
    margin-bottom: 9px;
  }

  @media screen and (min-width: 1096px) {
    font-size: 21px;
    margin-bottom: 9px;
  }

  @media screen and (min-width: 1355px) {
    font-size: 26px;
    margin-bottom: 14px;
  }

  @media screen and (min-width: 1614px) {
    font-size: 31px;
    margin-bottom: 10px;
  }

  @media screen and (min-width: 1873px) {
    font-size: 37px;
    margin-bottom: 8px;
  }
`;

export const StyledContainer = styled(Text)`
  width: 578px;
  height: 216px;

  @media screen and (min-width: 578px) {
    width: 837px;
    height: 313px;
  }

  @media screen and (min-width: 1096px) {
    width: 1096px;
    height: 411px;
  }

  @media screen and (min-width: 1355px) {
    width: 1355px;
    height: 508px;
  }

  @media screen and (min-width: 1614px) {
    width: 1614px;
    height: 606px;
  }

  @media screen and (min-width: 1873px) {
    width: 1872px;
    height: 703px;
  }
`;
