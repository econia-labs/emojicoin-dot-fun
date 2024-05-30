import { ToastContainer } from "react-toastify";

export const StyledToaster = () => {
  return (
    <ToastContainer
      position="bottom-left"
      autoClose={7100}
      closeOnClick
      limit={3}
      theme="dark"
    />
  );
};

export default StyledToaster;
