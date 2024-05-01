import styled from "styled-components";
import { ToastContainer } from "react-toastify";

const StyledContainer = styled(ToastContainer)`
  /** Used to define container behavior: width, position: fixed etc... **/
  .Toastify__toast-container {
  }

  /** Used to define the position of the ToastContainer **/
  .Toastify__toast-container--top-left {
  }
  .Toastify__toast-container--top-center {
  }
  .Toastify__toast-container--top-right {
  }
  .Toastify__toast-container--bottom-left {
  }
  .Toastify__toast-container--bottom-center {
  }
  .Toastify__toast-container--bottom-right {
  }

  /** Classes for the displayed toast **/
  .Toastify__toast {
  }
  .Toastify__toast--rtl {
  }
  // https://styled-components.com/docs/faqs#how-can-i-override-styles-with-higher-specificity
  .Toastify__toast-body {
    align-items: flex-start;
  }

  /** Used to position the icon **/
  .Toastify__toast-icon {
  }

  /** handle the notification color and the text color based on the theme **/
  .Toastify__toast-theme--dark {
  }
  .Toastify__toast-theme--light {
  }
  .Toastify__toast-theme--colored.Toastify__toast--default {
  }
  .Toastify__toast--info {
    background-color: ${({ theme }) => theme.colors.econiaBlue};
  }
  .Toastify__toast--success {
    background-color: ${({ theme }) => theme.colors.green};
  }
  .Toastify__toast--warning {
    background-color: ${({ theme }) => theme.colors.warning};
  }
  .Toastify__toast--error {
    background-color: ${({ theme }) => theme.colors.error};
  }

  .Toastify__progress-bar {
  }
  .Toastify__progress-bar--rtl {
  }
  .Toastify__progress-bar-theme--light {
  }
  .Toastify__progress-bar-theme--dark {
  }
  .Toastify__progress-bar--info {
    background-color: ${({ theme }) => theme.colors.econiaBlue};
  }
  .Toastify__progress-bar--success {
    background-color: ${({ theme }) => theme.colors.green};
  }
  .Toastify__progress-bar--warning {
    background-color: ${({ theme }) => theme.colors.warning};
  }
  .Toastify__progress-bar--error {
    background-color: ${({ theme }) => theme.colors.error};
  }
  /** colored notifications share the same progress bar color **/
  .Toastify__progress-bar-theme--colored.Toastify__progress-bar--info,
  .Toastify__progress-bar-theme--colored.Toastify__progress-bar--success,
  .Toastify__progress-bar-theme--colored.Toastify__progress-bar--warning,
  .Toastify__progress-bar-theme--colored.Toastify__progress-bar--error {
  }

  /** Classes for the close button. Better use your own closeButton **/
  .Toastify__close-button {
    color: ${({ theme }) => theme.colors.black};
    width: 20px;
    height: 20px;
  }
  .Toastify__close-button--default {
  }
  .Toastify__close-button > svg {
    width: 20px;
    height: 20px;
  }
  .Toastify__close-button:hover,
  .Toastify__close-button:focus {
  }
`;

export default StyledContainer;
