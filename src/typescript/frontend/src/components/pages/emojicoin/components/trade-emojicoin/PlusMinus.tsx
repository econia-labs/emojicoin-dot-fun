import { useState } from "react";
import styles from './PlusMinus.module.css';

const arrowWrapper = `
  flex border border-solid border-dark-gray radii-circle p-[12px] justify-center items-center
  w-[37px] h-[37px] absolute z-[2] left-[50%]
  translate-y-[-50%] translate-x-[-50%]
  bg-black cursor-pointer
  active:fill-ec-blue
  hover:fill-ec-blue
  hover:border-ec-blue
`;

enum State {
  Plus,
  Minus,
}



const PlusMinus = ({ onClick }) => {
  const [state, setState] = useState(State.Plus);

  return(
    <div
      className={`${styles.circle} ${state === State.Plus ? styles.plus : styles.minus} ${arrowWrapper} ${state === State.Plus ? "top-[100%]" : "top-[66%]"}`}
      onClick={() => {
        setState(state === State.Plus ? State.Minus : State.Plus);
        onClick();
      }}
    >
    </div>
  );
};

export default PlusMinus;
