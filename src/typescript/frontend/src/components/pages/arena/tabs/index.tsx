import { useState } from "react";
import { Emoji } from "utils/emoji";

type Tab = {
  name: string;
  emoji: string;
  element: React.ReactNode;
};

export const TabContainer = ({ tabs }: { tabs: Tab[] }) => {
  const [selectedTab, setSelectedTab] = useState(tabs.length > 0 ? tabs[0].name : undefined);
  return (
    <div
      className="grid h-[100%]"
      style={{
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div className="relative flex flex-row mt-[.5em] overflow-y-auto">
        {tabs.map((t) => {
          return (
            <div className="flex flex-row" key={`tab-${t.name}`}>
              <div className="w-[1em] border-solid border-b-[2px] border-dark-gray"></div>
              <div className="flex flex-col">
                <div
                  onClick={() => setSelectedTab(t.name)}
                  className={`flex flex-row gap-[.2em] uppercase pixel-heading-3 border-solid cursor-pointer select-none ${t.name === selectedTab ? "rounded-t-[6px] border-t-dark-gray border-x-dark-gray border-x-[2px] border-t-[2px] text-white" : "mt-[2px] text-light-gray"}`}
                  style={
                    t.name !== selectedTab
                      ? {
                          paddingLeft: "calc(.5em + 2px)",
                          paddingRight: "calc(.5em + 2px)",
                        }
                      : {
                          paddingLeft: ".5em",
                          paddingRight: ".5em",
                        }
                  }
                >
                  <div>{t.name}</div> <Emoji className="text-[.75em]" emojis={t.emoji} />
                </div>
                {t.name === selectedTab ? (
                  <div className="flex flex-row justify-between">
                    <div className="w-[2px] bg-dark-gray h-[2px]"></div>
                    <div className="w-[2px] bg-dark-gray h-[2px]"></div>
                  </div>
                ) : (
                  <div className="w-[100%] bg-dark-gray h-[2px]"></div>
                )}
              </div>
            </div>
          );
        })}
        <div className="w-[100%] h-[100%] border-solid border-b-[2px] border-dark-gray"></div>
      </div>
      <div className="h-[100%]">{tabs.find((t) => t.name === selectedTab)?.element}</div>
    </div>
  );
};

const BottomNavigationItem = ({
  emoji,
  text,
  onClick,
}: {
  emoji: string;
  text: string;
  onClick?: () => void;
}) => {
  return (
    <div onClick={onClick} className="flex flex-col place-items-center">
      <Emoji emojis={emoji} />
      <div className="uppercase tracking-widest text-light-gray">{text}</div>
    </div>
  );
};

export const BottomNavigation = ({ tabs }: { tabs: Tab[] }) => {
  return (
    <div
      className="fixed bottom-0 w-[100%] border-solid border-t-[1px] border-dark-gray h-[4em] bg-black/50"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        placeItems: "center",
      }}
    >
      {tabs.map((t) => (
        <BottomNavigationItem emoji={t.emoji} text={t.name} key={`navigation-item-${t.name}`} />
      ))}
    </div>
  );
};
