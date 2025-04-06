import { FormattedNumber } from "@/components/FormattedNumber";

export const FormattedNominalNumber = (props: {
  className?: string;
  value: bigint;
  prefix?: string;
  suffix?: string;
}) => (
  <FormattedNumber
    className={props.className}
    value={props.value}
    decimals={2}
    nominalize
    prefix={props.prefix}
    suffix={props.suffix}
  />
);
