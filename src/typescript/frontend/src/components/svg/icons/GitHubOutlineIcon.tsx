import Svg from "components/svg/Svg";
import { useThemeContext } from "context/theme-context";
import React from "react";

import type { SvgProps } from "../types";

const Icon: React.FC<SvgProps> = ({ color = "black", ...props }) => {
  const { theme } = useThemeContext();
  return (
    <Svg viewBox="0 0 27 27" {...props} color="transparent">
      <circle cx="13.4504" cy="13.4504" r="12.9504" stroke="black" />
      <path
        d="M13.2032 4.45056C8.23322 4.45056 4.20312 8.47995 4.20312 13.4506C4.20312 17.4271 6.7819 20.8007 10.3579 21.9908C10.8077 22.0741 10.9729 21.7955 10.9729 21.5578C10.9729 21.3432 10.9645 20.6342 10.9607 19.8822C8.45676 20.4266 7.92843 18.8203 7.92843 18.8203C7.51903 17.78 6.92915 17.5034 6.92915 17.5034C6.11261 16.9448 6.9907 16.9562 6.9907 16.9562C7.89448 17.0198 8.37037 17.8837 8.37037 17.8837C9.17307 19.2597 10.4758 18.8618 10.9894 18.6319C11.0701 18.0502 11.3034 17.6532 11.5608 17.4285C9.56178 17.2008 7.4603 16.4291 7.4603 12.9806C7.4603 11.998 7.81189 11.1951 8.38766 10.5648C8.2942 10.3381 7.98617 9.42276 8.47483 8.18307C8.47483 8.18307 9.23059 7.94117 10.9505 9.10562C11.6683 8.90615 12.4383 8.8062 13.2032 8.80281C13.968 8.8062 14.7385 8.90615 15.4578 9.10562C17.1757 7.94117 17.9304 8.18307 17.9304 8.18307C18.4202 9.42276 18.112 10.3381 18.0186 10.5648C18.5956 11.1951 18.9448 11.9979 18.9448 12.9806C18.9448 16.4373 16.8394 17.1985 14.8353 17.4213C15.1581 17.7006 15.4457 18.2483 15.4457 19.0879C15.4457 20.2921 15.4353 21.2613 15.4353 21.5578C15.4353 21.7973 15.5973 22.0779 16.0536 21.9896C19.6276 20.7981 22.2031 17.4258 22.2031 13.4506C22.2031 8.47995 18.1736 4.45056 13.2032 4.45056Z"
        fill={theme.colors[color]}
      />
      <path
        d="M7.57309 17.2713C7.55332 17.316 7.48288 17.3294 7.41886 17.2988C7.35356 17.2694 7.31686 17.2084 7.33803 17.1635C7.35745 17.1175 7.42789 17.1047 7.49304 17.1356C7.55847 17.1649 7.59574 17.2264 7.57309 17.2713ZM8.0158 17.6663C7.97288 17.7061 7.88896 17.6876 7.83199 17.6248C7.77313 17.562 7.76211 17.4781 7.80567 17.4377C7.84992 17.398 7.93131 17.4165 7.99032 17.4793C8.04919 17.5428 8.06062 17.6262 8.01573 17.6664L8.0158 17.6663ZM8.31953 18.1717C8.26433 18.2101 8.17412 18.1741 8.11843 18.0941C8.0633 18.0141 8.0633 17.9181 8.11963 17.8796C8.17553 17.8412 8.26433 17.8758 8.3208 17.9552C8.37586 18.0366 8.37586 18.1325 8.31946 18.1718L8.31953 18.1717ZM8.83311 18.7571C8.78377 18.8114 8.67874 18.7969 8.6018 18.7226C8.52317 18.6501 8.50122 18.5471 8.5507 18.4927C8.6006 18.4382 8.70627 18.4535 8.78377 18.5271C8.86191 18.5995 8.88577 18.7033 8.83318 18.7571H8.83311ZM9.4969 18.9547C9.47523 19.0252 9.37401 19.0572 9.27208 19.0273C9.1703 18.9964 9.10367 18.9139 9.12421 18.8426C9.14538 18.7717 9.24703 18.7383 9.34973 18.7704C9.45137 18.8011 9.51815 18.883 9.49697 18.9547H9.4969ZM10.2524 19.0385C10.255 19.1128 10.1685 19.1743 10.0615 19.1757C9.95387 19.178 9.86684 19.1179 9.86571 19.0449C9.86571 18.97 9.9502 18.909 10.0578 18.9072C10.1648 18.9051 10.2524 18.9648 10.2524 19.0385ZM10.9946 19.0101C11.0074 19.0825 10.933 19.1569 10.8268 19.1767C10.7223 19.1957 10.6256 19.151 10.6123 19.0792C10.5993 19.005 10.6751 18.9307 10.7794 18.9114C10.8858 18.8929 10.981 18.9364 10.9946 19.0101Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default Icon;
