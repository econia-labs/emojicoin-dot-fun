import { CloseIcon } from "components/svg";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs";

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
    component: <EnterTab />,
  },
  {
    name: "Profile" as TabName,
    emoji: emoji("ninja"),
    component: (
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
    component: <ChatTab market0={market0} market1={market1} />,
  },
  {
    name: "Info" as TabName,
    emoji: emoji("books"),
    component: <InfoTab />,
  },
];

export const TabContainer = (props: ArenaProps) => {
  const [selectedTab, setSelectedTab] = useState<TabName>("Position");

  const tabs = useMemo(() => getTabs(props, setSelectedTab), [props]);

  return (
    <div className="flex h-[100%] bg-black">
      <Tabs
        activeBg="black"
        value={selectedTab}
        onValueChange={(tab) => setSelectedTab(tab as TabName)}
        className="h-full flex flex-col w-full"
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.name} value={tab.name} endSlot={<Emoji emojis={tab.emoji} />}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.name}
            value={tab.name}
            className="data-[state=active]:flex data-[state=active]:grow flex-col overflow-auto"
          >
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
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
                {tab.component}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};
