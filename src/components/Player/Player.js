import React from "react";
import "./Player.scss";

const PLAYER_RADIUS = 20;

const Player = ({
  uuid,
  position = { x: 200, y: 200 },
  isRightSided = false,
}) => {
  return (
    <div
      className={`player ${isRightSided ? "rightSided" : ""}`}
      style={{
        width: PLAYER_RADIUS * 2 + "px",
        height: PLAYER_RADIUS * 2 + "px",
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <span>{uuid}</span>
    </div>
  );
};

export default Player;
