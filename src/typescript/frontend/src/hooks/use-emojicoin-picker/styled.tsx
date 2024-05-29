import styled from "styled-components";

export const StyledEmojiPickerWrapper = styled.div`
  .epr-main {
    background-color: ${({ theme }) => theme.colors.black};
    border-color: ${({ theme }) => theme.colors.darkGray};
    border-radius: ${({ theme }) => theme.radii.xSmall};

    .epr-search-container {
      .epr-icn-search {
        background-image: none;

        &:before {
          display: block;
          width: 55px;
          content: "Search:";
          font-family: ${({ theme }) => theme.fonts.pixelar};
          font-size: 20px;
        }
      }

      .epr-btn-clear-search {
        display: none;
      }

      input {
        background-color: ${({ theme }) => theme.colors.econiaBlue};
        border-color: ${({ theme }) => theme.colors.econiaBlue};
        border-radius: ${({ theme }) => theme.radii.xSmall};

        color: ${({ theme }) => theme.colors.black};
        padding: 8px 8px 8px 65px;
      }

      input::placeholder {
        color: ${({ theme }) => theme.colors.black};
        font-size: 20px;
        font-family: ${({ theme }) => theme.fonts.pixelar};
        text-transform: uppercase;
      }
    }

    .epr-body {
      .epr-emoji-category {
        .epr-emoji-category-label {
          background-color: ${({ theme }) => `${theme.colors.black}e1`};
          font-family: ${({ theme }) => theme.fonts.pixelar};
          font-size: 20px;
          color: ${({ theme }) => theme.colors.econiaBlue};
          text-transform: uppercase;
          font-weight: normal;
        }
      }
    }

    .epr_-3yva2a {
      border-top: none;

      :nth-child(2) {
        font-family: ${({ theme }) => theme.fonts.pixelar};
        font-size: 20px;
        color: ${({ theme }) => theme.colors.econiaBlue};
        text-transform: uppercase;
      }
    }
  }
`;
