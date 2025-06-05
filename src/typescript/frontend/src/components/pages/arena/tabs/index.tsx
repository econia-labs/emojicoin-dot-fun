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
        className="flex h-full w-full flex-col"
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
            className="flex-col overflow-auto data-[state=active]:flex data-[state=active]:grow"
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
    <div onClick={onClick} className="flex cursor-pointer flex-col place-items-center">
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
          className="fixed bottom-0 h-[4em] w-full border-t-[1px] border-solid border-dark-gray bg-black"
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
          <div className="relative z-[100]">
            {/* Backdrop, to hide the app behind the tab overlay */}
            <div className="fixed inset-0 z-[49] bg-black" />

            {/* Scrollable container */}
            <div className="fixed inset-0 z-[50] overflow-y-auto">
              <div
                className="grid min-h-[100dvh]"
                style={{
                  gridTemplateRows: "auto 1fr",
                }}
              >
                <div className="flex flex-row">
                  <div className="relative mt-[.5em] flex w-[100%] flex-row">
                    <div className="w-[1em] border-b-[2px] border-solid border-dark-gray"></div>
                    <div className="flex flex-col">
                      <div
                        className="flex cursor-pointer select-none flex-row gap-[.2em] rounded-t-[6px] border-x-[2px] border-t-[2px] border-solid border-x-dark-gray border-t-dark-gray uppercase text-white pixel-heading-3"
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
                        <div className="h-[2px] w-[2px] bg-dark-gray"></div>
                        <div className="h-[2px] w-[2px] bg-dark-gray"></div>
                      </div>
                    </div>
                    <div className="h-[100%] w-[100%] border-b-[2px] border-solid border-dark-gray"></div>
                  </div>
                </div>
                {tab.component}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
