import Planet from "@icons/Planet";
import Carousel from "components/carousel";

const Item = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center h-[40px] min-w-[fit-content] gap-[16px] mr-[16px]">
      <span className={`pixel-heading-3 uppercase text-ec-blue whitespace-nowrap`}>{children}</span>
      <Planet />
    </div>
  );
};
const TextCarousel = () => {
  const messages = ["Universal ownership", "Universal blockchain", "Universal language"];

  const items = messages
    .map((message, index) => <Item key={`first::${message}::${index}`}>{message}</Item>);

  return (
    <div className="w-full">
      <Carousel>{items}</Carousel>
    </div>
  );
};

export default TextCarousel;
