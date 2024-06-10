import Planet from "@icons/PlanetSVG";

const Item = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center h-[40px] min-w-[fit-content] gap-[16px]">
      <span className={`pixel-heading-3 uppercase text-ec-blue whitespace-nowrap`}>{children}</span>
      <Planet />
    </div>
  );
};

const TextCarousel = () => {
  const messages = ["Universal ownership", "Universal blockchain", "Universal language"];
  const firstCarousel = messages
    .flatMap((message) => Array.from({ length: 5 }, () => message))
    .map((message, index) => <Item key={`first::${message}::${index}`}>{message}</Item>);
  const secondCarousel = messages
    .flatMap((message) => Array.from({ length: 5 }, () => message))
    .map((message, index) => <Item key={`second::${message}::${index}`}>{message}</Item>);

  return (
    <div className="w-full">
      <div className="overflow-hidden w-full flex-row">
        <div className="flex">
          <div className="flex gap-[16px] animate-carousel">{firstCarousel}</div>
          <div className="flex gap-[16px] animate-carousel ml-[20px]">{secondCarousel}</div>
        </div>
      </div>
    </div>
  );
};

export default TextCarousel;
