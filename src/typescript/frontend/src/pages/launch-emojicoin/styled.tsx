import styled from "styled-components";

export const StyledEmojiPickerWrapper = styled.div`
  .epr-main {
    background-color: ${({ theme }) => theme.colors.black};
    border-color: ${({ theme }) => theme.colors.darkGrey};

    .epr-search-container {
      .epr-icn-search {
        display: none;
      }

      .epr-btn-clear-search {
      }

      input {
        background-color: ${({ theme }) => theme.colors.econiaBlue};
        border-color: ${({ theme }) => theme.colors.econiaBlue};
        color: ${({ theme }) => theme.colors.black};
        padding: 8px;
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
