import { CloseIcon } from "@/components/svg";

export const BlurModal = ({ children, close }: { close: () => void } & React.PropsWithChildren) => (
  <div
    className="absolute w-[100%] h-[100%] z-[10] p-[1em] grid place-items-center"
    style={{
      background: "#00000050",
      backdropFilter: "blur(8px)",
    }}
  >
    {children}
    <CloseIcon
      onClick={close}
      className="absolute right-[.5em] top-[.5em] p-[.5em] h-[2.5em] w-[2.5em] cursor-pointer"
      color="econiaBlue"
    />
  </div>
);
