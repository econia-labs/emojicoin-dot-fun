import React from "react";
import { useScramble } from "use-scramble";
import { Text } from "./text";

export default function Loading() {
    const { ref } = useScramble({
        text: `Loading...`,
        overdrive: false,
        speed: 0.5,
    });
    return (
        <div style={{
            height: "100%",
            width: "100%",
            display: "grid",
            placeItems: "center",
        }}><Text textScale="pixelHeading3" color="econiaBlue" textTransform="uppercase" ref={ref}>Loading...</Text></div>
    );
}
