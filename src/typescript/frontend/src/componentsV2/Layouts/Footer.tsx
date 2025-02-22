"use client";
import { FooterWrapper, FooterContent, Container, TextWrapper, FooterText } from "./styled";

const FooterComponent = (): JSX.Element => {
  return (
    <FooterWrapper>
      <FooterContent>
        <Container>
          <TextWrapper>
            <FooterText>
              V.M.C is a product of <a href="https://www.values.network">Values Network.</a>
            </FooterText>
          </TextWrapper>
        </Container>
      </FooterContent>
    </FooterWrapper>
  );
};

export default FooterComponent;
