import Info from "@/components/info";

export default function PriceHeaderInfo() {
  return (
    <div className="flex flex-row">
      Price
      <Info infoIconClassName="w-[13px] ml-1 mb-[2px]">The average execution price</Info>
    </div>
  );
}
