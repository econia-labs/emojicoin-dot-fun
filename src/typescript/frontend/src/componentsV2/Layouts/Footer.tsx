"use client";
import { FooterWrapper, FooterContent, Container, TextWrapper, FooterText } from "./styled";

const FooterComponent = (): JSX.Element => {
  return (
    <FooterWrapper>
      <FooterContent>
        <Container>
          <TextWrapper>
            <FooterText>
              <a href="https://valuesnetwork.com">V.M.C is a product of Values Network.</a>
            </FooterText>
          </TextWrapper>
        </Container>
      </FooterContent>
    </FooterWrapper>
  );
};

export default FooterComponent;
