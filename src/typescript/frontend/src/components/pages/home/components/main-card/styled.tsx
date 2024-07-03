import styled from "styled-components";
import Image from "components/image";

export const StyledImage = styled(Image)`
  width: 289px;

  @media screen and (min-width: 578px) {
    width: 417px;
  }

  @media screen and (min-width: 1096px) {
    width: 545px;
  }

  @media screen and (min-width: 1355px) {
    width: 675px;
  }

  @media screen and (min-width: 1614px) {
    width: 803px;
  }

  @media screen and (min-width: 1873px) {
    width: 932px;
  }
`;
