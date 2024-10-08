import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import HomePage from "../../src/app/home/HomePage";

describe("state store", () => {


  it("creates the state store", () => {
    render(<HomePage />);
  });
});
