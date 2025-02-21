"use client";
import { StyledImage } from "components/image/styled";
import { useRouter } from "next/navigation";

interface CoinCardProps {
  id: string;
  title: string;
  time: string;
  value: string;
  change: string;
  description: string;
}

const CoinCard: React.FC<CoinCardProps> = ({ id, title, time, value, change, description }) => {
  const router = useRouter();
  return (
    <div
      className="box-show cursor-pointer px-5 mt-12 py-5 flex-box items-center rounded-full round"
      onClick={() => {
        router.push(`/coin?id=${id}`);
      }}
    >
      <div className="flex items-center mr-5 sm-mb">
        <StyledImage className="box-img" src="/images/home/box-cir.png" />
      </div>
      <div className="w50-box">
        <div className="flex mb-5">
          <div className="mr-3" style={{ width: "20px" }}>
            <StyledImage src="/images/home/fire.png" />
          </div>
          <div className="font-medium flex items-center justify-center text-sm px-2 py-0 border-green text-green rounded-full mr-3">
            {change}
          </div>
        </div>
        <h1 className="mb-3 main-title-sm text-white dark:text-white">{title}</h1>
        <p className="text-white text-sm w50-box font-light">{description}</p>
      </div>
      <div className="mr-6" style={{ marginRight: "4rem" }}>
        <h5 className="mb-3 main-title-sm-2 text-white dark:text-white">{time}</h5>
      </div>
      <div>
        <h5 className="mb-3 main-title-sm-2  text-white dark:text-white">{value}</h5>
      </div>
    </div>
  );
};

export default CoinCard;
