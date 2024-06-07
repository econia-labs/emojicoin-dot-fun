import { useScramble } from "use-scramble";

export interface ConnectedInfoProps {
  connected: boolean;
  handleClick: () => void;
  className: string;
}

export const ConnectedInfo: React.FC<ConnectedInfoProps> = ({ handleClick, className }) => {
  const { ref, replay } = useScramble({
    text: "VERIFY ACCOUNT",
    overdrive: true,
    overflow: true,
    speed: 0.7,
  });

  return (
    <>
      <div className={className}>
        <span className={className + " px-2.5"}>{"{"}</span>
        <button className={className} ref={ref} onClick={handleClick} onMouseOver={replay}></button>
        <span className={className + " px-2.5"}>{"}"}</span>
      </div>
    </>
  );
};

export default ConnectedInfo;
