"use client";

import Text from "components/text";
import { translationFunction } from "context/language-context";
import communityProjects from "../../../../public/community-projects.json";
import { ProjectEntry } from "./ProjectEntry";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, TitleBar } from "@react95/core";
import { Clippy } from "./Clippy";
import styled from "styled-components";
import Button from "components/button";
import { useMatchBreakpoints } from "@hooks/index";
import { useWindowSize } from "react-use";

const PARAM_KEY = "project";
const JSON_FILE_GITHUB_URL =
  "https://github.com/econia-labs/emojicoin-dot-fun/blob/main/src/typescript/frontend/public/community-projects.json";

export default function CultClientPage() {
  const { t } = translationFunction();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile } = useMatchBreakpoints();

  const { height, width } = useWindowSize();

  const project = searchParams.get(PARAM_KEY);
  const selectedProject = communityProjects.find((proj) => proj.id === project);
  const setSelectedProject = (id?: string) => {
    if (!id) {
      return router.replace(pathname);
    }
    router.replace(`${pathname}?${PARAM_KEY}=${id}`);
  };

  return (
    <>
      {selectedProject && (
        <StyledAlert
          title={selectedProject.name}
          message={selectedProject.description}
          dragOptions={{
            disabled: true,
            defaultPosition: { x: width / 2, y: height / 2 },
          }}
          type="info"
          className="max-w-[700px] -translate-x-1/2 -translate-y-1/2 [&>*]:!pl-2 !font-pixelar !lowercase [&>div>button]:lowercase"
          titleBarOptions={
            <TitleBar.Close className="!h-[90%]" key="close" onClick={() => setSelectedProject()} />
          }
          buttons={[
            {
              value: "Take me there",
              onClick: () => {
                window.open(selectedProject.url, "_blank");
              },
            }
          ]}
        />
      )}
      <Clippy monologue={t("Cult disclaimer")?.split("\n") || []} />
      <div className="flex flex-col grow">
        <div className="flex flex-col justify-center items-center px-6 grow gap-12">
          <div className="flex flex-col w-full max-w-[700px]">
            <Text textAlign={"center"} textScale={isMobile ? "pixelHeading1" : "pixelDisplay2"}>
              {t("Explore cult")}
            </Text>
          </div>
          <div className="flex flex-row gap-4 sm:justify-start mobile-sm:justify-center md:w-[600px] min-h-[200px] flex-wrap">
            {communityProjects.map((proj) => (
              <ProjectEntry key={proj.name} project={proj} onClick={setSelectedProject} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center grow">
        <Button scale="lg" onClick={() => window.open(JSON_FILE_GITHUB_URL, "_blank")}>
          Submit your project
        </Button>
      </div>
    </>
  );
}

//Fix text overflowing from header
const StyledAlert = styled(Alert)`
  font-family: var(--font-pixelar);
  & > .draggable {
    height: auto;
  }
`;
