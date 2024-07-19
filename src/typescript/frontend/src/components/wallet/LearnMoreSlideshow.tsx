import DottedInbox from "components/svg/slideshow/DottedInbox";
import DottedLink from "components/svg/slideshow/DottedLink";
import DottedStar from "components/svg/slideshow/DottedStar";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type SlideState } from "./WalletModal";

export const Slide = () => {};

type SlideshowProps = {
  slide: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setSlide: Dispatch<SetStateAction<SlideState>>;
  onLeftArrow: () => void;
  onRightArrow: () => void;
};

export const SLIDE_INDICES = [0, 1, 2, 3];

const HEADERS = ["A better way to login.", "What is a wallet?", "Explore more of Web3."];
const DESCRIPTIONS = [
  "Aptos Connect is a web3 wallet that uses a Social Login to create accounts on the Aptos blockchain.",
  "Wallets are a secure way to send, receive, and interact with digital assets like cryptocurrencies & NFTs.",
  "Aptos Connect lets you use one account across any application built on Aptos. Explore the ecosystem.",
];

export const AnimatedSVG = ({ animateKey, slide }: { animateKey: number; slide: number }) => {
  return (
    <div className="flex w-full min-h-[148px]">
      <div className="m-auto">
        {slide === 1 ? (
          <DottedLink key={`dotted-link::${animateKey}`} />
        ) : slide === 2 ? (
          <DottedInbox key={`dotted-inbox::${animateKey}`} />
        ) : slide === 3 ? (
          <DottedStar key={`dotted-star::${animateKey}`} />
        ) : null}
      </div>
    </div>
  );
};

export const LearnMoreSlideshow = ({
  slide,
  increment,
  decrement,
  setSlide,
  onLeftArrow,
  onRightArrow,
}: SlideshowProps) => {
  const [nonce, setNonce] = useState(0);

  // For easy re-triggering animations on a slide change.
  useEffect(() => {
    setNonce((n) => n + 1);
  }, [slide]);

  // Set up event listeners for left and right arrow keys.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          onLeftArrow();
          break;
        case "ArrowRight":
          onRightArrow();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [slide, setSlide, onLeftArrow, onRightArrow]);

  return slide >= 1 ? (
    <div className="flex flex-col relative text-black font-pixelar text-md uppercase w-full min-h-[420px] justify-between">
      {/* About Aptos Connect */}
      <div className="flex w-full text-xl mt-[2.75ch]">
        <span className="m-auto">About aptos connect</span>
      </div>

      {/* Inner content (SVGs + text) */}
      <div className="flex flex-col w-full gap-6">
        <AnimatedSVG animateKey={nonce} slide={slide} />
        <div className="flex flex-col gap-1">
          <div className="m-auto text-3xl">{HEADERS.at(slide - 1)}</div>
          <div className="m-auto text-md px-10">{DESCRIPTIONS.at(slide - 1)}</div>
        </div>
      </div>

      {/* Back      ___ ___ ___      Next */}
      <div className="flex flex-row w-full justify-between">
        <div className="flex flex-row gap-1 p-5 text-xl hover:scale-110" onClick={decrement}>
          <span>{"{"}</span>
          <div className="hover:cursor-pointer">Back</div>
          <span>{"}"}</span>
        </div>
        <div className="flex flex-row">
          <div className="flex flex-row gap-2 py-2 m-auto">
            {[1, 2, 3].map((i) => (
              <div
                onClick={() =>
                  setSlide(({ idx, direction }) => {
                    if (i === idx) {
                      return { idx, direction };
                    } else if (i < idx) {
                      return { idx: i, direction: "left" };
                    } else {
                      return { idx: i, direction: "right" };
                    }
                  })
                }
                key={i}
                className="flex h-6 w-6 hover:cursor-pointer"
              >
                <div
                  className="m-auto bg-black h-[2px] w-[3ch]"
                  style={{ opacity: i == slide ? 1 : 0.25 }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-row gap-1 p-5 text-xl hover:scale-110" onClick={increment}>
          <span>{"{"}</span>
          <div className="hover:cursor-pointer">
            {slide !== SLIDE_INDICES.at(-1)! ? "Next" : "Finish"}
          </div>
          <span>{"}"}</span>
        </div>
      </div>
    </div>
  ) : null;
};

export default LearnMoreSlideshow;
