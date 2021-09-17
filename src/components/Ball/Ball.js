import React, { useEffect, useReducer, useRef, useState } from "react";
import "./Ball.scss";
// import ballImage from "/ball.png";
import { BALL_RADIUS } from "../../constants";

const Ball = ({ position }) => {
  const [ballRotation, setBallRotation] = useState(0);
  const lastPosition = useRef(position);
  useEffect(() => {
    const delta =
      position.x - lastPosition.current.x + position.y - lastPosition.current.y;

    if (delta) setBallRotation((r) => r + delta * 3);
    lastPosition.current = position;
  }, [position]);
  return (
    <div
      style={{
        backgroundImage: `url(/ball.png)`,
        width: 2 * BALL_RADIUS + "px",
        height: 2 * BALL_RADIUS + "px",
        transform: `translate(${position.x}px, ${position.y}px) rotate(${ballRotation}deg)`,
      }}
      id="ball"
    ></div>
  );
};

export default Ball;
