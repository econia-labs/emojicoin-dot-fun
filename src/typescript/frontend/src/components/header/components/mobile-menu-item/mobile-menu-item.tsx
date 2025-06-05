import Arrow from "components/svg/icons/Arrow";
import Text from "components/text";
import { translationFunction } from "context/language-context";
import { cn } from "lib/utils/class-name";
import type { ReactElement } from "react";
import { useScramble } from "use-scramble";

interface Props {
  icon?: ReactElement;
  title: string;
  onClick?: () => void;
  pill?: {
    className: string;
    pill: React.ReactNode;
  };
  noBorder?: boolean;
}

const MobileMenuItem: React.FC<Props> = ({ noBorder, icon, title, onClick = () => {}, pill }) => {
  const { t } = translationFunction();

  const { ref, replay } = useScramble({
    text: `${t(title)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <div
      className={cn(
        "flex w-full cursor-pointer justify-between px-3 py-1.5",
        !noBorder && "border-b border-dashed border-b-ec-blue"
      )}
      onMouseOver={replay}
      onClick={onClick}
    >
      <div className={cn("flex items-center", pill?.className)}>
        {icon}
        <Text
          textScale={icon ? "pixelHeading4" : "pixelHeading3"}
          color="econiaBlue"
          textTransform="uppercase"
          ref={ref}
        />
        {pill?.pill}
      </div>
      {!icon && <Arrow width="18px" color="econiaBlue" />}
    </div>
  );
};

export default MobileMenuItem;
