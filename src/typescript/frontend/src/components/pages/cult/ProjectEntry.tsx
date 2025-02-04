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
      className="flex flex-col gap-2 cursor-pointer items-center w-[150px]"
      onClick={() => onClick(project.id)}
    >
      <Image width={80} height={80} src={textfile} alt="Text file" />
      <div className="w-[100px]">
        <Text
          className="bg-white px-1"
          textAlign="center"
          color="darkGray"
          textScale={"pixelHeading4"}
          fontWeight={"bold"}
        >
          {project.name}.txt
        </Text>
      </div>
    </div>
  );
};
