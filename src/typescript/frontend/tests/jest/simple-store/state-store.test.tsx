import Counter, { displayCountPattern } from "./Counter";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const renderCounter = () => render(<Counter />);

describe("zustand", () => {
  it("should increment a simple state store count", async () => {
    renderCounter();
    expect(await screen.findByTestId("count")).toBeInTheDocument();
  });

  it("should increase the count by clicking a button", async () => {
    const user = userEvent.setup();
    renderCounter();
    expect(await screen.findByTestId("count")).toBeInTheDocument();
    const findPattern = async (n: number) => await screen.findByText(displayCountPattern(n));
    expect(await findPattern(0)).toBeInTheDocument();
    await act(async () => {
      await user.click(await screen.findByTestId("button"));
    });
    expect(await findPattern(1)).toBeInTheDocument();
  });
});
