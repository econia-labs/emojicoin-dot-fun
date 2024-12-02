import Image from "next/image";

const OKXIcon = ({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className: string;
}) => {
  return (
    <Image
      className={className}
      width={width + 2}
      height={height + 2}
      alt="okx logo"
      src="/images/wallets/okx-logo.png"
    ></Image>
  );
};

export default OKXIcon;
