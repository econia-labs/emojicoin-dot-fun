import React from "react";
import { Link } from "components";

export default {
  title: "Components/Links",
};

export const Links: React.FC = () => {
  return (
    <>
      <Link href="/">Default</Link>

      <Link href="/" color="error">
        Custom color
      </Link>

      <Link external href="/">
        External
      </Link>
    </>
  );
};
