import { CloseIcon } from "@/components/svg";

export default function BlurModal({
  children,
  close,
}: { close: () => void } & React.PropsWithChildren) {
  return (
    <div
      className="absolute z-[10] grid h-[100%] w-[100%] place-items-center p-[1em]"
      style={{
        background: "#000000ee",
        backdropFilter: "blur(7px)",
      }}
    >
      {children}
      <CloseIcon
        onClick={close}
        className="absolute right-[.5em] top-[.5em] h-[2.5em] w-[2.5em] cursor-pointer p-[.5em]"
        color="econiaBlue"
      />
    </div>
  );
}
