import { CloseIcon } from "components/svg";
import { ToastContainer } from "react-toastify";

const StyledToaster = () => {
  return (
    <ToastContainer
      style={{ width: "500px", maxWidth: "100dvw" }}
      toastStyle={{ background: "black", border: "1px solid #33343D" }}
      position="bottom-left"
      autoClose={7100}
      closeOnClick
      closeButton={(close) => (
        <div className="absolute top-[16px] right-[16px]" onClick={close.closeToast}>
          <CloseIcon width="16px" />
        </div>
      )}
      limit={3}
      theme="dark"
    />
  );
};

export default StyledToaster;
