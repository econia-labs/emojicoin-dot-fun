import Carousel from "components/carousel";

import Planet from "@/icons/Planet";

const Item = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mr-[16px] flex h-[40px] min-w-[fit-content] items-center justify-center gap-[16px]">
      <span className={`whitespace-nowrap uppercase text-ec-blue pixel-heading-3`}>{children}</span>
      <Planet />
    </div>
  );
};
const TextCarousel = () => {
  const messages = ["Universal ownership", "Universal blockchain", "Universal language"];

  const items = messages.map((message, index) => (
    <Item key={`first::${message}::${index}`}>{message}</Item>
  ));

  return (
    <div className="w-full">
      <Carousel>{items}</Carousel>
    </div>
  );
};

export default TextCarousel;
