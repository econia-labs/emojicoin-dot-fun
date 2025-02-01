import Text from "components/text";
import Image from "next/image";
import { type FC } from "react";
import { type CommunityProject } from "types/community-project";
import textfile from "../../../../public/images/textfile.svg";

interface Props {
  project: CommunityProject;
  onClick: (id: string) => void;
}

export const ProjectEntry: FC<Props> = ({ project, onClick }) => {
  return (
    <div
      className="flex flex-col gap-2 cursor-pointer items-center w-[100px]"
      onClick={() => onClick(project.id)}
    >
      <Image width={50} height={50} src={textfile} alt="Text file" />
      <div className="bg-white px-1">
        <Text color="darkGray" textScale={"pixelBodyLarge"} fontWeight={"bold"}>
          {project.name}.txt
        </Text>
      </div>
    </div>
  );
};
