"use client";

import React from "react";
import Svg from "components/svg/Svg";

import { type SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ ...props }) => {
  const { theme } = useThemeContext();

  return (
    <Svg viewBox="0 0 27 27" {...props} color="transparent">
      <g clipPath="url(#clip0_14173_4938)">
        <path
          d="M23.0982 4.6821C20.7452 2.33025 17.4956 0.875 13.9058 0.875C10.3161 0.875 7.06535 2.33025 4.71237 4.6821C2.36053 7.03508 0.905273 10.2847 0.905273 13.8744C0.905273 17.4642 2.36053 20.7149 4.71237 23.0668C7.06535 25.4197 10.3149 26.8739 13.9047 26.8739C17.4945 26.8739 20.7441 25.4186 23.097 23.0668C25.45 20.7138 26.9041 17.4642 26.9041 13.8744C26.9041 10.2847 25.4489 7.03508 23.097 4.6821H23.0982ZM1.72563 14.2818H4.64979C4.69872 16.5096 5.14588 18.5963 5.89341 20.4054H3.61325C2.48113 18.6248 1.79845 16.5301 1.72449 14.2818H1.72563ZM18.2454 13.4694C18.2238 11.2381 18.0213 9.15026 17.6845 7.3457H21.0365C21.8238 9.12751 22.2983 11.2199 22.3495 13.4694H18.2454ZM10.3786 13.4694C10.4014 11.2245 10.6085 9.13206 10.9532 7.3457H16.8584C17.2032 9.13319 17.4103 11.2245 17.433 13.4694H10.3786ZM17.433 14.2818C17.4103 16.5267 17.2032 18.6191 16.8584 20.4054H10.9532C10.6085 18.6179 10.4014 16.5267 10.3786 14.2818H17.433ZM17.5195 6.53331C17.3875 5.93255 17.2385 5.36933 17.0769 4.85049C16.698 3.63759 16.2338 2.65339 15.7059 1.96843C17.2942 2.46793 18.7188 3.6137 19.8372 5.20435C20.1285 5.61851 20.3993 6.06339 20.6462 6.53331H17.5207H17.5195ZM16.3021 5.09171C16.442 5.53887 16.5706 6.0213 16.6878 6.53331H11.125C11.2422 6.0213 11.3708 5.53887 11.5108 5.09171C12.1673 2.98904 13.0184 1.68853 13.907 1.68853C14.7956 1.68853 15.6455 2.98904 16.3021 5.09171ZM10.7359 4.85049C10.5732 5.36933 10.4253 5.93255 10.2933 6.53331H7.16776C7.41466 6.06226 7.68546 5.61851 7.97674 5.20435C9.0952 3.6137 10.5197 2.46793 12.1081 1.96843C11.5802 2.65339 11.1159 3.63759 10.7371 4.85049H10.7359ZM10.1283 7.3457C9.7904 9.15026 9.58901 11.2393 9.56739 13.4694H5.46332C5.51452 11.2199 5.98899 9.12751 6.77635 7.3457H10.1283ZM4.64979 13.4694H1.72563C1.79959 11.2211 2.48227 9.12637 3.61439 7.3457H5.89455C5.14588 9.15481 4.69872 11.2427 4.65093 13.4694H4.64979ZM5.46219 14.2818H9.56625C9.58787 16.513 9.7904 18.6009 10.1272 20.4054H6.77521C5.98785 18.6236 5.51339 16.5312 5.46219 14.2818ZM10.2922 21.2178C10.4253 21.8186 10.5732 22.3818 10.7348 22.9006C11.1137 24.1135 11.5779 25.0977 12.1058 25.7827C10.5175 25.2832 9.09292 24.1374 7.97446 22.5468C7.68318 22.1326 7.41238 21.6877 7.16548 21.2178H10.291H10.2922ZM11.5096 22.6594C11.3697 22.2123 11.2411 21.7298 11.1239 21.2178H16.6866C16.5694 21.7298 16.4409 22.2123 16.3009 22.6594C15.6444 24.7621 14.7933 26.0626 13.9058 26.0626C13.0184 26.0626 12.1673 24.7621 11.5096 22.6594ZM17.0758 22.9006C17.2385 22.3818 17.3864 21.8186 17.5184 21.2178H20.6439C20.397 21.6889 20.1262 22.1326 19.8349 22.5468C18.7165 24.1374 17.292 25.2832 15.7036 25.7827C16.2315 25.0977 16.6957 24.1135 17.0746 22.9006H17.0758ZM17.6834 20.4054C18.0213 18.6009 18.2227 16.5119 18.2443 14.2818H22.3484C22.2972 16.5312 21.8227 18.6236 21.0353 20.4054H17.6834ZM23.1619 14.2818H26.0861C26.0121 16.5301 25.3294 18.6248 24.1973 20.4054H21.9171C22.6658 18.5963 23.113 16.5085 23.1608 14.2818H23.1619ZM23.1619 13.4694C23.113 11.2415 22.6658 9.15481 21.9183 7.3457H24.1984C25.3306 9.12637 26.0132 11.2211 26.0872 13.4694H23.163H23.1619ZM22.5236 5.25783C22.9218 5.65606 23.2927 6.08274 23.6329 6.53331H21.5519C21.239 5.89045 20.8863 5.28969 20.4983 4.73785C19.9112 3.9027 19.2422 3.17906 18.5117 2.58967C20.0238 3.20864 21.3858 4.12116 22.5224 5.25783H22.5236ZM5.2881 5.25783C6.42477 4.12116 7.78672 3.2075 9.29887 2.58967C8.5684 3.17792 7.9005 3.90156 7.31226 4.73785C6.92427 5.28969 6.57155 5.89045 6.25865 6.53331H4.1776C4.51781 6.08274 4.88873 5.6572 5.28696 5.25783H5.2881ZM5.2881 22.4933C4.88987 22.0951 4.51894 21.6684 4.17874 21.2178H6.25979C6.57268 21.8607 6.9254 22.4615 7.3134 23.0133C7.9005 23.8484 8.56953 24.5721 9.3 25.1603C7.78672 24.5425 6.42591 23.63 5.28924 22.4922L5.2881 22.4933ZM22.5236 22.4933C21.3869 23.63 20.025 24.5425 18.5128 25.1615C19.2433 24.5732 19.9112 23.8496 20.4994 23.0144C20.8874 22.4626 21.2401 21.8618 21.553 21.219H23.6341C23.2939 21.6695 22.923 22.0951 22.5247 22.4944L22.5236 22.4933Z"
          fill={theme.colors.econiaBlue}
        />
      </g>
      <defs>
        <clipPath id="clip0_14173_4938">
          <rect width="26" height="26" fill="white" transform="translate(0.905273 0.875)" />
        </clipPath>
      </defs>
    </Svg>
  );
};

export default Icon;
