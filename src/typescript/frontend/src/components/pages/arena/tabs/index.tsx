import { CloseIcon } from "components/svg";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import type { ArenaProps } from "../utils";
import ChatTab from "./ChatTab";
import EnterTab from "./enter-tab/EnterTab";
import InfoTab from "./InfoTab";
import ProfileTab from "./profile-tab/ProfileTab";

type TabName = "Position" | "Profile" | "Chat" | "Info";

const getTabs = (
  { market0, market1, arenaInfo }: ArenaProps,
  setSelectedTab: (tab: TabName) => void
) => [
  {
    name: "Position" as TabName,
    emoji: emoji("smiling face with horns"),
    element: <EnterTab />,
  },
  {
    name: "Profile" as TabName,
    emoji: emoji("ninja"),
    element: (
      <ProfileTab
        {...{
          market0,
          market1,
          goToEnter: () => setSelectedTab("Position"),
          arenaInfo,
        }}
      />
    ),
  },
  {
    name: "Chat" as TabName,
    emoji: emoji("left speech bubble"),
    element: <ChatTab market0={market0} market1={market1} />,
  },
  {
    name: "Info" as TabName,
    emoji: emoji("books"),
    element: <InfoTab />,
  },
];

export const TabContainer = (props: ArenaProps) => {
  const [selectedTab, setSelectedTab] = useState<TabName>("Position");

  const tabs = useMemo(() => getTabs(props, setSelectedTab), [props]);

  return (
    <div
      className="grid h-[100%] bg-black bg-opacity-80"
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
      <div className="overflow-y-auto">{tabs.find((t) => t.name === selectedTab)?.element}</div>
    </div>
  );
};

const NavigationItem = ({
  emoji,
  text,
  onClick,
}: {
  emoji: string;
  text: string;
  onClick?: () => void;
}) => {
  return (
    <div onClick={onClick} className="flex flex-col place-items-center cursor-pointer">
      <Emoji emojis={emoji} />
      <div className="uppercase tracking-widest text-light-gray">{text}</div>
    </div>
  );
};

export const MobileNavigation = (props: ArenaProps) => {
  const [selectedTab, setSelectedTab] = useState<TabName | undefined>();

  const tabs = useMemo(() => getTabs(props, setSelectedTab), [props]);

  const tab = useMemo(
    () => (selectedTab === undefined ? undefined : tabs.find((t) => t.name === selectedTab)!),
    [selectedTab, tabs]
  );

  return (
    <>
      {!tab && (
        <div
          className="fixed bottom-0 w-full border-solid border-t-[1px] border-dark-gray h-[4em] bg-black"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            placeItems: "center",
          }}
        >
          {tabs.map((t) => (
            <NavigationItem
              onClick={() => setSelectedTab(t.name)}
              emoji={t.emoji}
              text={t.name}
              key={`navigation-item-${t.name}`}
            />
          ))}
        </div>
      )}
      {!!tab &&
        createPortal(
          <>
            {/* Backdrop, to hide the app behind the tab overlay */}
            <div className="fixed inset-0 bg-black z-[49]" />

            {/* Scrollable container */}
            <div className="fixed inset-0 z-[50] overflow-y-auto">
              <div
                className="min-h-[100dvh] grid"
                style={{
                  gridTemplateRows: "auto 1fr",
                }}
              >
                <div className="flex flex-row">
                  <div className="relative flex flex-row mt-[.5em] w-[100%]">
                    <div className="w-[1em] border-solid border-b-[2px] border-dark-gray"></div>
                    <div className="flex flex-col">
                      <div
                        className="flex flex-row gap-[.2em] uppercase pixel-heading-3 border-solid cursor-pointer select-none rounded-t-[6px] border-t-dark-gray border-x-dark-gray border-x-[2px] border-t-[2px] text-white"
                        style={
                          tab.name !== selectedTab
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
                        <div>{tab.name}</div> <Emoji className="text-[.75em]" emojis={tab.emoji} />
                        <CloseIcon
                          className="h-[.5em] w-[.5em]"
                          color="econiaBlue"
                          onClick={() => setSelectedTab(undefined)}
                        />
                      </div>
                      <div className="flex flex-row justify-between">
                        <div className="w-[2px] bg-dark-gray h-[2px]"></div>
                        <div className="w-[2px] bg-dark-gray h-[2px]"></div>
                      </div>
                    </div>
                    <div className="w-[100%] h-[100%] border-solid border-b-[2px] border-dark-gray"></div>
                  </div>
                </div>
                {tab.element}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};
