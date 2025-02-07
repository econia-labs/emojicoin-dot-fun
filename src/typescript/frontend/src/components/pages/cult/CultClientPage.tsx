"use client";

// cspell:word mycomputer
// cspell:word recyclebin
// cspell:word desktopapp

import { translationFunction } from "context/language-context";
import communityProjects from "../../../../public/community-projects.json";
import { Alert, TitleBar } from "@react95/core";
import { Clippy } from "./Clippy";
import styled from "styled-components";
import { useWindowSize } from "react-use";
import { CommunityCreationWinDesktopItem, WinDesktopItem, WinIcons } from "./WinDesktopItem";
import { useState, useMemo } from "react";
import { shuffle } from "lodash";

const JSON_FILE_GITHUB_URL =
  "https://github.com/econia-labs/emojicoin-dot-fun/blob/main/src/typescript/frontend/public/community-projects.json";

const { t } = translationFunction();

export default function CultClientPage() {
  const { width, height } = useWindowSize();
  const [modalContent, setModalContent] = useState<{
    title: string;
    body: string;
    buttons?: { value: string; onClick: () => void }[];
  }>();

  const [containerRef, setContainerRef] = useState<HTMLDivElement>();

  const [randomPositions, minHeight] = useMemo(() => {
    const CELL_SIZE = 200;
    const width = containerRef?.clientWidth || 0;
    const max_cols = Math.max(1, Math.floor(width / CELL_SIZE));
    const max_rows = Math.max(2, Math.ceil(communityProjects.length / max_cols));
    const OFFSET_RANGE = 40;

    const leftoverWidth = width - max_cols * CELL_SIZE;

    // Generate every possible position on the grid:
    const allPositions = Array.from({ length: max_rows }, (_, y) =>
      Array.from({ length: max_cols }, (_, x) => ({
        x: x * CELL_SIZE + Math.random() * OFFSET_RANGE + leftoverWidth / 2,
        y: y * CELL_SIZE + Math.random() * OFFSET_RANGE,
      }))
    ).flat();

    return [shuffle(allPositions), max_rows * CELL_SIZE] as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, width]);

  const setSelectedProject = (id: string) => {
    const project = communityProjects.find((proj) => proj.id === id);
    if (!project) return;

    setModalContent({
      title: project.name,
      body: project.description,
      buttons: [{ value: t("Go now"), onClick: () => window.open(project.url, "_blank") }],
    });
  };

  const clippyMonologue = useMemo(() => {
    return t("Cult disclaimer").split("\n");
  }, []);

  return (
    <>
      {modalContent && (
        <StyledAlert
          title={modalContent.title}
          message={modalContent.body}
          dragOptions={{
            disabled: true,
            defaultPosition: { x: width / 2, y: height / 2 },
          }}
          type="info"
          className="max-w-[700px] -translate-x-1/2 -translate-y-1/2 [&>*]:!pl-2 !font-pixelar !lowercase [&>div>button]:lowercase text-[27px]"
          titleBarOptions={<TitleBar.Close onClick={() => setModalContent(undefined)} />}
          buttons={modalContent.buttons || []}
        />
      )}
      <Clippy monologue={clippyMonologue} />

      <div className="grid mobile-sm:self-center mobile-lg:self-start mobile-sm:grid-cols-1 mobile-lg:grid-cols-4 gap4 grow mobile-sm:p-2 sm:p-10 md:p-20 align-start gap-12">
        <div className="flex flex-col gap-12">
          <WinDesktopItem
            icon={WinIcons.MY_COMPUTER}
            label={t("My Computer")}
            onClick={() =>
              setModalContent({ body: t("Cult welcome message"), title: t("Welcome") })
            }
          />
          <WinDesktopItem
            icon={WinIcons.RECYCLE_BIN}
            label={t("Recycle Bin")}
            onClick={() =>
              setModalContent({ body: t("Recycle bin message"), title: t("Recycle Bin") })
            }
          />
          <WinDesktopItem
            icon={WinIcons.DESKTOP_APP}
            label="Submit an app"
            onClick={() => window.open(JSON_FILE_GITHUB_URL, "_blank")}
          />
        </div>
        <div
          ref={(ref) => setContainerRef(ref || undefined)}
          className={`flex flex-col mobile-lg:col-span-3 relative gap-12`}
          style={{ minHeight }}
        >
          {communityProjects.map((proj, i) => (
            <CommunityCreationWinDesktopItem
              key={proj.id}
              icon={WinIcons.TEXT_FILE}
              label={proj.name + ".txt"}
              onClick={() => setSelectedProject(proj.id)}
              pos={randomPositions[i]}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// Since there is so much customization, having styled-components is not so bad. Tailwind is good for smaller changes.
const StyledAlert = styled(Alert)`
  font-family: var(--font-pixelar);
  z-index: 2000;
  padding-bottom: 24px;
  & > div:nth-child(2) {
    flex-direction: row;
    white-space: pre-wrap;
    padding: 30px 40px 30px 40px !important;
    @media (max-width: 640px) {
      padding: 10px 10px 10px 10px !important;
    }
    & > div:first-child > svg {
      width: 50px;
      height: 50px;

      @media (max-width: 320px) {
        display: none;
      }
    }
  }
  & > div > button {
    font-size: 27px;
    text-transform: uppercase;
    padding: 7px 30px;
  }
  & > .draggable {
    height: auto;
    font-size: 36px;
    width: 50px;
    height: 50px;
  }

  & > div > button {
    font-size: 27px;
    text-transform: uppercase;
    padding: 7px 30px;
  }
  & > .draggable {
    width: 100%;
    height: auto;
    font-size: 36px;
    display: flex;
    align-items: center;
    & button {
      &::before {
        transform: translate(0px, 1px);
        content: url("images/close.svg");
        scale: 2.5;
      }
      & > img {
        display: none;
      }
      margin-right: 8px;
      height: 32px;
      width: 32px;
    }
  }
`;
