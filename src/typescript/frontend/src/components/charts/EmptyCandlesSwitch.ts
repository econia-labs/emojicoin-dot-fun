// The purpose of this component is to be injected in the trading view header as a custom element.
// Although not a very elegant solution, this is how tradingview expects the element to be created.
// Several attempts were made to inject a React component using React Portals, but didn't give conclusive results.
// My assumption is that tradingview dynamically creates the header during first load, and since React Portal injects the component at a later time, the header is not properly rendered.
const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    cursor: "pointer",
    userSelect: "none",
    gap: "6px",
  },
  track: {
    width: "32px",
    height: "16px",
    borderRadius: "8px",
    position: "relative",
    transition: "background-color 0.2s",
  },
  knob: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    position: "absolute",
    top: "2px",
    transition: "left 0.2s",
    background: "#FFFFFF",
  },
  label: {
    fontSize: "14px",
  },
} as const;
const applyStyles = (element: HTMLElement, styles: Record<string, string>) => {
  Object.assign(element.style, styles);
};

export const createSwitch = (
  container: HTMLElement,
  options: { initialState: boolean; label: string; onTitle: string; offTitle: string }
) => {
  applyStyles(container, styles.container);

  const track = document.createElement("div");
  track.className = "switch-track";
  applyStyles(track, styles.track);

  const knob = document.createElement("div");
  knob.className = "switch-knob";
  applyStyles(knob, styles.knob);

  const label = document.createElement("span");
  label.textContent = options.label;
  applyStyles(label, styles.label);

  track.appendChild(knob);
  container.appendChild(label);
  container.appendChild(track);

  const setState = (isOn: boolean) => {
    track.style.backgroundColor = isOn ? "#4CAF50" : "#9CA3AF";
    knob.style.left = isOn ? "18px" : "2px";
    container.setAttribute("title", isOn ? options.onTitle : options.offTitle);
  };

  setState(options.initialState);

  return { setState };
};
