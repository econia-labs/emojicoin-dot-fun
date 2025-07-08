import Info from "@/components/info";

export default function PriceHeaderInfo() {
  return (
    <div className="flex flex-row">
      Price
      <Info infoIconClassName="w-[13px] ml-1 mb-[2px]">
        The reported average execution price includes fees and may be affected by integer
        truncation. In some cases, it may appear significantly different from the AMM&apos;s
        internal spot price.
      </Info>
    </div>
  );
}
