import BidirectionalArrowIcon from "@icons/BidirectionalArrow";
import { useState } from "react";

const arrowWrapper = `
  flex border border-solid border-dark-gray radii-circle p-[12px] justify-center items-center
  w-[37px] h-[37px] absolute z-[2] top-[50%] left-[50%]
  translate-y-[-50%] translate-x-[-50%]
  bg-black cursor-pointer
  active:fill-ec-blue
  hover:fill-ec-blue
  hover:border-ec-blue transition-all duration-200
`;

const FlipInputsArrow = ({ onClick }) => {
  const [hoverArrow, setHoverArrow] = useState(false);

  return (
    <div
      className={arrowWrapper}
      onClick={onClick}
      onMouseOver={() => setHoverArrow(true)}
      onMouseOut={() => setHoverArrow(false)}
    >
      <div
        style={{
          rotate: hoverArrow ? "180deg" : "0deg",
          transition: "200ms",
          color: hoverArrow ? "white" : "",
        }}
        className={`relative w-full h-full ${hoverArrow ? "rotate-180 text-white" : "rotate-0 text-white"}`}
      >
        <BidirectionalArrowIcon
          strokeWidth={2.3}
          className="rotate-90 scale-[1.5]"
          strokeLinecap="square"
        />
      </div>
    </div>
  );
};

export default FlipInputsArrow;
